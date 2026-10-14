import React, { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import { GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';
import { FastForward } from 'lucide-react';

interface Props {
  map: L.Map | null;
  isActive: boolean;
  onComplete: () => void;
  durationMs?: number;
}

// Find index of southernmost point (lowest latitude)
function getSouthernStartIndex(polygon: [number, number][]): number {
  let minLat = Infinity;
  let southIdx = 0;
  for (let i = 0; i < polygon.length; i++) {
    if (polygon[i][0] < minLat) {
      minLat = polygon[i][0];
      southIdx = i;
    }
  }
  return southIdx;
}

// Build closed loop starting from the south, traveling along the perimeter, and returning to the south
const SOUTH_INDEX = getSouthernStartIndex(GREAT_KURDISTAN_POLYGON);
const ORDERED_KURDISTAN_PERIMETER: [number, number][] = [
  ...GREAT_KURDISTAN_POLYGON.slice(SOUTH_INDEX),
  ...GREAT_KURDISTAN_POLYGON.slice(0, SOUTH_INDEX),
  GREAT_KURDISTAN_POLYGON[SOUTH_INDEX], // Closes the perimeter back at the southern origin
];

/**
 * ئینترۆی تەنها تیشکی زەرد:
 * تەنها تیشکێکی زەردی باریک و بچووک بەبێ هیچ ڕووناکییەک یان سێبەرێک بۆ دەوروبەر.
 * لە باشوورەوە بە باریکی دەستپێدەکات، هێڵی نەخشەکە دەکێشێت بەبێ ڕووناککردنەوەی دەوروبەر،
 * تا دەگاتەوە شوێنی خۆی لە باشوور.
 */
export const KurdishMapBorderIllumination: React.FC<Props> = ({
  map,
  isActive,
  onComplete,
  durationMs = 4000,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const isTerminatedRef = useRef<boolean>(false);

  // Projected screen coordinates of the perimeter
  const projectedPointsRef = useRef<{ x: number; y: number }[]>([]);

  // Project map coordinates into container pixel space
  const projectCoordinates = useCallback(() => {
    if (!map) return;
    try {
      const pts = ORDERED_KURDISTAN_PERIMETER.map(([lat, lng]) => {
        const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
        return { x: pt.x, y: pt.y };
      });
      projectedPointsRef.current = pts;
    } catch (err) {
      console.warn('Error projecting Kurdistan polygon coordinates:', err);
    }
  }, [map]);

  // Frame the map to Kurdistan and listen for changes
  useEffect(() => {
    if (!map || !isActive) return;

    // Gently frame Kurdistan so the entire path is in view
    const kurdistanBounds = L.latLngBounds(GREAT_KURDISTAN_POLYGON);
    map.fitBounds(kurdistanBounds, {
      padding: [25, 25],
      maxZoom: 6.2,
      animate: false,
    });

    projectCoordinates();

    const onMapChange = () => {
      projectCoordinates();
    };

    map.on('move', onMapChange);
    map.on('zoom', onMapChange);
    map.on('resize', onMapChange);

    return () => {
      map.off('move', onMapChange);
      map.off('zoom', onMapChange);
      map.off('resize', onMapChange);
    };
  }, [map, isActive, projectCoordinates]);

  // Main Canvas Animation Loop
  useEffect(() => {
    if (!isActive || !map) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    isTerminatedRef.current = false;

    // Resize canvas with devicePixelRatio cap (max 2 for high performance)
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();
    projectCoordinates();

    startTimeRef.current = null;

    // 82% travel time, remaining time for holding full line and clean fade
    const travelDuration = durationMs * 0.82;

    const animate = (timestamp: number) => {
      if (isTerminatedRef.current) return;

      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear frame
      ctx.clearRect(0, 0, width, height);

      const pts = projectedPointsRef.current;

      if (pts.length >= 3) {
        // Compute segment lengths and cumulative distances
        const segLengths: number[] = [];
        const cumDist: number[] = [0];
        let totalLength = 0;

        for (let i = 0; i < pts.length - 1; i++) {
          const dx = pts[i + 1].x - pts[i].x;
          const dy = pts[i + 1].y - pts[i].y;
          const len = Math.hypot(dx, dy);
          segLengths.push(len);
          totalLength += len;
          cumDist.push(totalLength);
        }

        // Calculate travel progress along the path (0 to 1)
        const travelProgress = Math.min(elapsed / travelDuration, 1);

        // Smooth cubic ease-in-out for natural, elegant motion
        const easedProgress =
          travelProgress < 0.5
            ? 4 * travelProgress * travelProgress * travelProgress
            : 1 - Math.pow(-2 * travelProgress + 2, 3) / 2;

        const currentDist = easedProgress * totalLength;

        // Helper: get coordinates at specific distance along perimeter
        const getPointAtDist = (targetD: number): { x: number; y: number; segIdx: number } => {
          const clamped = Math.max(0, Math.min(totalLength, targetD));
          let idx = 0;
          for (let i = 0; i < cumDist.length - 1; i++) {
            if (clamped >= cumDist[i] && clamped <= cumDist[i + 1]) {
              idx = i;
              break;
            }
          }
          const segStartD = cumDist[idx];
          const segLen = segLengths[idx] || 1;
          const segFrac = Math.max(0, Math.min(1, (clamped - segStartD) / segLen));
          return {
            x: pts[idx].x + (pts[idx + 1].x - pts[idx].x) * segFrac,
            y: pts[idx].y + (pts[idx + 1].y - pts[idx].y) * segFrac,
            segIdx: idx,
          };
        };

        const headPoint = getPointAtDist(currentDist);

        // Clean fade out at the very end (last 300ms)
        let globalAlpha = 1;
        if (elapsed > durationMs - 300) {
          globalAlpha = Math.max(0, (durationMs - elapsed) / 300);
        }

        ctx.save();
        ctx.globalAlpha = globalAlpha;

        // Zero shadow blur ensures NO surrounding area is illuminated (دەوروبەر ڕووناک ناکاتەوە)
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';

        // 1. Draw the Clean Traced Border Line (هێڵی نەخشەکە بە باریکی و ڕوونی)
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i <= headPoint.segIdx; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.lineTo(headPoint.x, headPoint.y);

        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#eab308'; // Crisp yellow
        ctx.stroke();
        ctx.restore();

        // 2. Active Yellow Light Beam Section (تیشکە زەردە باریکەکە)
        const beamLength = Math.min(36, currentDist);
        const tailDist = Math.max(0, currentDist - beamLength);
        const tailPoint = getPointAtDist(tailDist);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(tailPoint.x, tailPoint.y);
        for (let i = tailPoint.segIdx + 1; i <= headPoint.segIdx; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.lineTo(headPoint.x, headPoint.y);

        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#fde047'; // Bright crisp yellow
        ctx.stroke();
        ctx.restore();

        // 3. Small, Sharp Yellow Dot at the Head (خاڵێکی بچووک و باریکی زەرد بەبێ هیچ تەم یان ڕووناکییەک بۆ دەوروبەر)
        if (travelProgress < 1.0) {
          ctx.save();
          // Small solid yellow dot
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(headPoint.x, headPoint.y, 2.4, 0, Math.PI * 2);
          ctx.fill();

          // Tiny pure white center core
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(headPoint.x, headPoint.y, 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Closed at south point
          ctx.save();
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(pts[0].x, pts[0].y, 2.4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        ctx.restore();
      }

      if (elapsed < durationMs) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        isTerminatedRef.current = true;
        ctx.clearRect(0, 0, width, height);
        onComplete();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      isTerminatedRef.current = true;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isActive, map, durationMs, onComplete, projectCoordinates]);

  // Skip immediately on tap or click
  const handleSkip = useCallback(() => {
    isTerminatedRef.current = true;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    onComplete();
  }, [onComplete]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleSkip}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer z-20 overflow-hidden select-none"
      title="کلیک بکە بۆ تێپەڕاندن"
    >
      {/* 1. Hardware-accelerated 2D Canvas - No dark backdrop or background tint */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ willChange: 'transform' }}
      />

      {/* 2. Sleek Minimal Floating Skip Pill at Top-Right */}
      <div className="absolute top-3.5 right-3.5 z-30 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#070b14]/75 hover:bg-[#0c1220]/90 border border-amber-500/25 hover:border-amber-400/50 backdrop-blur-md text-[10px] sm:text-xs text-amber-300 shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-all cursor-pointer group"
        >
          <span>تێپەڕاندن</span>
          <FastForward className="w-3 h-3 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
