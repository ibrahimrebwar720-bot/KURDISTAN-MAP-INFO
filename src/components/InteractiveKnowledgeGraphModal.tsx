import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { X, Sparkles, MapPin, ZoomIn, ZoomOut, RotateCcw, Compass, ExternalLink } from 'lucide-react';
import { FactItem } from '../data/kurdishHistoryData';
import { getKnowledgeGraphNetwork } from '../utils/factRelations';
import { getCategoryInfo, getAccessibleCategoryColor } from '../types/history';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { formatDigits } from '../utils/yearUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  centerFact: FactItem | null;
  allFacts: FactItem[];
  onSelectFact: (fact: FactItem) => void;
  onOpenFactDetail: (fact: FactItem) => void;
}

interface SimNode {
  fact: FactItem;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isCenter: boolean;
  color: string;
  label: string;
  categoryName: string;
  relationLabel?: string;
}

export const InteractiveKnowledgeGraphModal: React.FC<Props> = ({
  isOpen,
  onClose,
  centerFact,
  allFacts,
  onSelectFact,
  onOpenFactDetail,
}) => {
  const { theme, colorMode } = useTheme();
  const isDark = colorMode === 'dark';
  const { language, isEn, dir } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active center fact state (can be updated within modal when user clicks orbiting nodes!)
  const [activeCenterFact, setActiveCenterFact] = useState<FactItem | null>(centerFact);
  const [hoveredNode, setHoveredNode] = useState<SimNode | null>(null);
  const [selectedNodeInfo, setSelectedNodeInfo] = useState<FactItem | null>(null);

  useEffect(() => {
    if (centerFact) {
      setActiveCenterFact(centerFact);
      setSelectedNodeInfo(centerFact);
    }
  }, [centerFact]);

  // Compute graph network for active center fact
  const graphNetwork = useMemo(() => {
    return getKnowledgeGraphNetwork(activeCenterFact, allFacts, language);
  }, [activeCenterFact, allFacts, language]);

  // Dragging and interaction state
  const draggingNodeRef = useRef<SimNode | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomLevelRef = useRef<number>(1);
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isPanningRef = useRef<boolean>(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const nodesRef = useRef<SimNode[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize simulation nodes when graphNetwork changes
  useEffect(() => {
    if (!graphNetwork || !isOpen) return;

    const { centerFact: cf, nodes, links } = graphNetwork;
    const width = containerRef.current?.clientWidth || 800;
    const height = containerRef.current?.clientHeight || 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const simNodes: SimNode[] = [];

    // Center Node (The Sun)
    const centerCat = getCategoryInfo(cf, language);
    simNodes.push({
      fact: cf,
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      radius: 44,
      isCenter: true,
      color: theme.primaryColor || '#f59e0b',
      label: cf.name,
      categoryName: centerCat.name,
    });

    // Orbiting Satellite Nodes
    const count = nodes.length;
    nodes.forEach((node, idx) => {
      const angle = (idx / Math.max(1, count)) * Math.PI * 2;
      const baseDistance = Math.min(width, height) * 0.32;
      const distance = baseDistance + (idx % 2 === 0 ? 30 : -20);
      const cat = getCategoryInfo(node, language);

      // Find matching link for label
      const link = links.find((l) => l.target.id === node.id || l.source.id === node.id);

      simNodes.push({
        fact: node,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: 0,
        vy: 0,
        radius: link?.isDirectParent ? 34 : 28,
        isCenter: false,
        color: link?.color || cat.color || '#38bdf8',
        label: node.name,
        categoryName: cat.name,
        relationLabel: link?.label,
      });
    });

    nodesRef.current = simNodes;
  }, [graphNetwork, isOpen, theme.primaryColor, language]);

  // Spring Physics & Canvas Render Loop
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2 + panOffsetRef.current.x;
      const centerY = height / 2 + panOffsetRef.current.y;
      const zoom = zoomLevelRef.current;

      ctx.clearRect(0, 0, width, height);

      // Save transform for zoom & pan
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(zoom, zoom);
      ctx.translate(-width / 2, -height / 2);

      const nodes = nodesRef.current;
      const centerNode = nodes[0];

      // Physics Simulation Step
      if (centerNode) {
        if (draggingNodeRef.current !== centerNode) {
          centerNode.x += (width / 2 - centerNode.x) * 0.08;
          centerNode.y += (height / 2 - centerNode.y) * 0.08;
        }

        for (let i = 1; i < nodes.length; i++) {
          const node = nodes[i];
          if (draggingNodeRef.current === node) continue;

          const dx = centerNode.x - node.x;
          const dy = centerNode.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const targetDist = 180 + (i % 3) * 35;
          const force = (dist - targetDist) * 0.003;

          node.vx += (dx / dist) * force;
          node.vy += (dy / dist) * force;

          node.vx += (-dy / dist) * 0.15;
          node.vy += (dx / dist) * 0.15;

          for (let j = 1; j < nodes.length; j++) {
            if (i === j) continue;
            const other = nodes[j];
            const odx = node.x - other.x;
            const ody = node.y - other.y;
            const odist = Math.sqrt(odx * odx + ody * ody) || 1;
            const minDist = node.radius + other.radius + 40;
            if (odist < minDist) {
              const rep = (minDist - odist) * 0.04;
              node.vx += (odx / odist) * rep;
              node.vy += (ody / odist) * rep;
            }
          }

          node.vx *= 0.88;
          node.vy *= 0.88;
          node.x += node.vx;
          node.y += node.vy;
        }
      }

      // Draw Static Connection Lines
      if (centerNode) {
        for (let i = 1; i < nodes.length; i++) {
          const node = nodes[i];
          const nodeColor = getAccessibleCategoryColor(node.color, isDark);

          ctx.beginPath();
          ctx.moveTo(centerNode.x, centerNode.y);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 2.2;
          ctx.globalAlpha = 0.85;
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          if (node.relationLabel) {
            const mx = (centerNode.x + node.x) / 2;
            const my = (centerNode.y + node.y) / 2;

            ctx.font = "10px 'Rabar', 'Noto Serif', serif";
            const textWidth = ctx.measureText(node.relationLabel).width;
            const padding = 6;

            ctx.fillStyle = isDark ? 'rgba(10, 15, 30, 0.85)' : 'rgba(255, 255, 255, 0.94)';
            ctx.beginPath();
            ctx.roundRect(mx - textWidth / 2 - padding, my - 10, textWidth + padding * 2, 20, 10);
            ctx.fill();

            ctx.strokeStyle = nodeColor;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.7;
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.relationLabel, mx, my);
          }
        }
      }

      // Draw Satellite Nodes
      for (let i = 1; i < nodes.length; i++) {
        const node = nodes[i];
        const isHovered = hoveredNode === node;
        const nodeColor = getAccessibleCategoryColor(node.color, isDark);

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + (isHovered ? 8 : 4), 0, Math.PI * 2);
        ctx.fillStyle = nodeColor;
        ctx.globalAlpha = isHovered ? 0.35 : 0.16;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(12, 17, 34, 0.95)' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = isHovered ? 2.5 : 1.75;
        ctx.strokeStyle = nodeColor;
        ctx.stroke();

        ctx.font = "bold 11px 'Rabar', 'Noto Serif', serif";
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const displayLabel = node.label.length > 12 ? node.label.slice(0, 10) + '..' : node.label;
        ctx.fillText(displayLabel, node.x, node.y);

        ctx.font = "bold 9px 'Rabar', 'Noto Serif', serif";
        ctx.fillStyle = isDark ? '#94a3b8' : '#475569';
        ctx.fillText(node.categoryName, node.x, node.y + node.radius + 12);
      }

      // Draw Center Node
      if (centerNode) {
        const centerColor = getAccessibleCategoryColor(centerNode.color, isDark);

        ctx.beginPath();
        ctx.arc(centerNode.x, centerNode.y, centerNode.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = centerColor;
        ctx.globalAlpha = 0.22;
        ctx.fill();
        ctx.globalAlpha = 1.0;

        ctx.beginPath();
        ctx.arc(centerNode.x, centerNode.y, centerNode.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#050814' : '#ffffff';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = centerColor;
        ctx.shadowColor = centerColor;
        ctx.shadowBlur = isDark ? 20 : 12;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = "bold 13px 'Rabar', 'Noto Serif', serif";
        ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = centerNode.label.split(' ');
        if (words.length > 2) {
          ctx.fillText(words.slice(0, 2).join(' '), centerNode.x, centerNode.y - 7);
          ctx.fillText(words.slice(2).join(' '), centerNode.x, centerNode.y + 10);
        } else {
          ctx.fillText(centerNode.label, centerNode.x, centerNode.y);
        }
      }

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, hoveredNode, isDark]);

  // Handle Resize of Canvas
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Transform Screen to Graph Coords
  const screenToGraphCoords = useCallback((screenX: number, screenY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2 + panOffsetRef.current.x;
    const centerY = height / 2 + panOffsetRef.current.y;
    const zoom = zoomLevelRef.current;

    const x = (screenX - centerX) / zoom + width / 2;
    const y = (screenY - centerY) / zoom + height / 2;
    return { x, y };
  }, []);

  // Mouse & Touch Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = screenToGraphCoords(screenX, screenY);

    const clickedNode = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 6;
    });

    if (clickedNode) {
      draggingNodeRef.current = clickedNode;
      dragOffsetRef.current = { x: clickedNode.x - x, y: clickedNode.y - y };
      setSelectedNodeInfo(clickedNode.fact);
    } else {
      isPanningRef.current = true;
      panStartRef.current = { x: screenX - panOffsetRef.current.x, y: screenY - panOffsetRef.current.y };
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const { x, y } = screenToGraphCoords(screenX, screenY);

    if (draggingNodeRef.current) {
      draggingNodeRef.current.x = x + dragOffsetRef.current.x;
      draggingNodeRef.current.y = y + dragOffsetRef.current.y;
      draggingNodeRef.current.vx = 0;
      draggingNodeRef.current.vy = 0;
      return;
    }

    if (isPanningRef.current) {
      panOffsetRef.current = {
        x: screenX - panStartRef.current.x,
        y: screenY - panStartRef.current.y,
      };
      return;
    }

    const foundHover = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius + 4;
    });
    setHoveredNode(foundHover || null);
  };

  const handlePointerUp = () => {
    draggingNodeRef.current = null;
    isPanningRef.current = false;
  };

  const handleZoom = (delta: number) => {
    zoomLevelRef.current = Math.max(0.4, Math.min(2.5, zoomLevelRef.current + delta));
  };

  const handleResetView = () => {
    zoomLevelRef.current = 1;
    panOffsetRef.current = { x: 0, y: 0 };
  };

  if (!isOpen) return null;

  const nodeCount = graphNetwork?.nodes.length || 0;

  const accessibleThemePrimary = getAccessibleCategoryColor(theme.primaryColor, isDark);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 animate-fade-in select-none ${
        isDark ? 'bg-black/85' : 'bg-slate-900/50 backdrop-blur-sm'
      }`}
      dir={dir}
    >
      <div
        ref={containerRef}
        className={`relative w-full h-full max-w-7xl max-h-[100dvh] sm:max-h-[92vh] flex flex-col rounded-none sm:rounded-[4px] overflow-hidden border ${
          isDark
            ? 'bg-[#070b14] border-amber-500/30 border-t-amber-400/50 shadow-[0_25px_70px_rgba(0,0,0,0.95)]'
            : 'bg-[#f4f3ef] border-slate-300 shadow-2xl'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-40 blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: accessibleThemePrimary }}
        />

        {/* 1. Top Header Bar */}
        <header className={`relative z-10 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b ${
          isDark ? 'border-amber-500/20 bg-[#0b0f1c]' : 'border-slate-300 bg-white'
        }`}>
          <div className="flex items-center gap-2.5 text-start">
            <div
              className="w-8 h-8 rounded-[4px] flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: `${accessibleThemePrimary}1f`,
                borderColor: `${accessibleThemePrimary}60`,
                color: accessibleThemePrimary,
              }}
            >
              <Compass className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h2 className={`text-sm sm:text-base font-black flex items-center gap-1.5 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <span>{isEn ? 'Historical Knowledge Graph' : 'تۆڕی پەیوەندییە مێژووییەکان'}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-[3px] border tabular-nums font-bold ${
                  isDark
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-amber-100 text-amber-900 border-amber-300'
                }`}>
                  {formatDigits(nodeCount, language)} {isEn ? (nodeCount === 1 ? 'node' : 'nodes') : 'گرێ'}
                </span>
              </h2>
              <p className={`text-[10px] sm:text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {isEn
                  ? 'Interactive constellation view: drag nodes to explore historical connections'
                  : 'سیستەمی گرافی تیشکدەر: گرێکان ڕابکێشە بۆ بینینی پەیوەندییەکان'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Zoom Controls */}
            <div className={`hidden sm:flex items-center gap-1 px-1.5 py-1 rounded-[4px] border ${
              isDark ? 'bg-[#101626] border-amber-500/25' : 'bg-slate-100 border-slate-300'
            }`}>
              <button
                type="button"
                onClick={() => handleZoom(0.15)}
                className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-white text-slate-700 hover:text-slate-950'
                }`}
                title={isEn ? 'Zoom in' : 'نزیککردنەوە'}
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleZoom(-0.15)}
                className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-white text-slate-700 hover:text-slate-950'
                }`}
                title={isEn ? 'Zoom out' : 'دوورخستنەوە'}
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetView}
                className={`p-1 rounded-[3px] transition-colors cursor-pointer ${
                  isDark ? 'hover:bg-white/10 text-slate-300 hover:text-white' : 'hover:bg-white text-slate-700 hover:text-slate-950'
                }`}
                title={isEn ? 'Reset view' : 'ڕێکخستنەوە'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              title={isEn ? 'Close' : 'داخستن'}
              className={`p-2 rounded-[4px] border transition-colors cursor-pointer ${
                isDark
                  ? 'bg-[#101626] hover:bg-[#182033] text-slate-300 hover:text-white border-amber-500/25 hover:border-amber-400/50'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-950 border-slate-300'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 2. Interactive Canvas Area */}
        <div className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block touch-none"
          />

          {/* Quick Guidance Hint */}
          <div className={`absolute top-3 start-3 pointer-events-none px-2.5 py-1 rounded-[3px] border text-[10px] flex items-center gap-1.5 ${
            isDark
              ? 'bg-black/80 border-amber-500/20 text-slate-300'
              : 'bg-white/95 border-slate-300 text-slate-700 shadow-sm font-medium'
          }`}>
            <Sparkles className={`w-3 h-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`} />
            <span>
              {isEn
                ? 'Drag any node to reposition and click to inspect'
                : 'دەتوانیت هەر گرێیەک بە دەست ڕابکێشیت و کلیکی لەسەر بکەیت'}
            </span>
          </div>

          {/* Selected Node Drawer / Floating Card (Bottom) */}
          {selectedNodeInfo && (() => {
            const selectedCat = getCategoryInfo(selectedNodeInfo, language);
            const selectedCatColor = getAccessibleCategoryColor(selectedCat.color, isDark);
            return (
              <div className={`absolute bottom-3 start-3 end-3 sm:end-auto sm:w-96 rounded-[4px] border p-3.5 animate-fade-in flex flex-col gap-2.5 text-start ${
                isDark
                  ? 'bg-[#0b0f1c] border-amber-500/30 border-t-amber-400/50 shadow-2xl'
                  : 'bg-white border-slate-300 border-t-amber-500 shadow-xl'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className="w-2 h-2 rounded-[2px]"
                        style={{ backgroundColor: selectedCatColor }}
                      />
                      <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {selectedCat.name}
                      </span>
                      {selectedNodeInfo.id === activeCenterFact?.id && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-[2px] border font-bold ${
                          isDark
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                            : 'bg-amber-100 text-amber-900 border-amber-300'
                        }`}>
                          {isEn ? 'Current Center' : 'ناوەندی ئێستا'}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedNodeInfo.name}
                    </h3>
                  </div>

                  {selectedNodeInfo.id !== activeCenterFact?.id && (
                    <button
                      type="button"
                      onClick={() => setActiveCenterFact(selectedNodeInfo)}
                      className={`px-2 py-1 rounded-[3px] text-[10px] font-bold border transition-colors cursor-pointer ${
                        isDark
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                      }`}
                    >
                      {isEn ? 'Set as Center' : 'کردن بە ناوەند'}
                    </button>
                  )}
                </div>

                <p className={`text-[11px] line-clamp-2 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {selectedNodeInfo.desc ||
                    selectedNodeInfo.fullText ||
                    (isEn ? 'Historical record for this entry.' : 'زانیاری مێژوویی لەسەر ئەم شوێنە.')}
                </p>

                <div className={`flex items-center gap-2 pt-1 border-t ${
                  isDark ? 'border-amber-500/15' : 'border-slate-200'
                }`}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectFact(selectedNodeInfo);
                    }}
                    className="preserve-contrast flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-[4px] bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-[11px] transition-colors shadow-sm cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{isEn ? 'Show on Map' : 'پیشاندان لەسەر نەخشە'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFactDetail(selectedNodeInfo);
                    }}
                    className={`p-1.5 rounded-[4px] border transition-colors cursor-pointer ${
                      isDark
                        ? 'bg-[#101626] hover:bg-[#182033] border-amber-500/25 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                    title={isEn ? 'Full Details' : 'تەواوی وردەکارییەکان'}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

