import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FactItem, GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';
import { getCategoryInfo } from '../types/history';
import { getAllFactImages } from '../utils/historicalImages';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import { toKurdishDigits } from '../utils/yearUtils';
import {
  X,
  Download,
  Copy,
  Share2,
  Check,
  Sparkles,
  Smartphone,
  Square,
  Palette,
  Images,
  Edit2,
  RotateCcw,
  Compass,
  MapPin,
  Calendar,
  Layers,
  Info,
} from 'lucide-react';

export type CardFormat = 'story' | 'square';
export type CardTheme = 'royal_gold' | 'parchment_antique' | 'emerald_flag' | 'midnight_dark';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  fact: FactItem | null;
  allFacts?: FactItem[];
}

interface ThemeConfig {
  id: CardTheme;
  name: string;
  bgGradStart: string;
  bgGradMid: string;
  bgGradEnd: string;
  accent: string;
  accentLight: string;
  border: string;
  textColor: string;
  subtextColor: string;
  mapFill: string;
  mapStroke: string;
}

const THEMES: Record<CardTheme, ThemeConfig> = {
  royal_gold: {
    id: 'royal_gold',
    name: 'ئاڵتوونی شاهانە',
    bgGradStart: '#080c18',
    bgGradMid: '#0d1527',
    bgGradEnd: '#04070f',
    accent: '#f59e0b',
    accentLight: '#fef08a',
    border: 'rgba(245, 158, 11, 0.45)',
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    mapFill: 'rgba(245, 158, 11, 0.12)',
    mapStroke: '#f59e0b',
  },
  parchment_antique: {
    id: 'parchment_antique',
    name: 'دەستنووسی مێژوویی',
    bgGradStart: '#1b120c',
    bgGradMid: '#241810',
    bgGradEnd: '#0f0a07',
    accent: '#d97706',
    accentLight: '#fed7aa',
    border: 'rgba(217, 119, 6, 0.5)',
    textColor: '#fef3c7',
    subtextColor: '#d6d3d1',
    mapFill: 'rgba(217, 119, 6, 0.15)',
    mapStroke: '#d97706',
  },
  emerald_flag: {
    id: 'emerald_flag',
    name: 'ئاڵای نیشتمانی',
    bgGradStart: '#032019',
    bgGradMid: '#063529',
    bgGradEnd: '#02120e',
    accent: '#10b981',
    accentLight: '#a7f3d0',
    border: 'rgba(16, 185, 129, 0.5)',
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    mapFill: 'rgba(16, 185, 129, 0.15)',
    mapStroke: '#10b981',
  },
  midnight_dark: {
    id: 'midnight_dark',
    name: 'ڕەشی مۆدێرن',
    bgGradStart: '#0b0f19',
    bgGradMid: '#020408',
    bgGradEnd: '#000000',
    accent: '#38bdf8',
    accentLight: '#bae6fd',
    border: 'rgba(56, 189, 248, 0.4)',
    textColor: '#ffffff',
    subtextColor: '#94a3b8',
    mapFill: 'rgba(56, 189, 248, 0.12)',
    mapStroke: '#38bdf8',
  },
};

// Calculate normalized bounding box of Greater Kurdistan Polygon once
const KURDISTAN_BOUNDS = (() => {
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  for (const [lat, lng] of GREAT_KURDISTAN_POLYGON) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
  }
  // Add small padding so bounds don't clip at borders
  const latPad = (maxLat - minLat) * 0.06;
  const lngPad = (maxLng - minLng) * 0.06;
  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  };
})();

/**
 * Draw 21-ray Kurdish Sun of the National Flag on 2D Canvas
 */
function drawKurdistanSun(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  accentColor = '#f59e0b'
) {
  ctx.save();
  // Ambient radial sun halo
  const glow = ctx.createRadialGradient(cx, cy, innerR * 0.4, cx, cy, outerR * 1.5);
  glow.addColorStop(0, 'rgba(251, 191, 36, 0.4)');
  glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
  glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // 21 triangular sun rays
  const totalRays = 21;
  const step = (Math.PI * 2) / totalRays;
  const halfStep = step / 2;

  for (let i = 0; i < totalRays; i++) {
    const angle = i * step - Math.PI / 2; // start from 12 o'clock
    const tipX = cx + Math.cos(angle) * outerR;
    const tipY = cy + Math.sin(angle) * outerR;

    const baseAngleLeft = angle - halfStep * 0.75;
    const baseAngleRight = angle + halfStep * 0.75;
    const baseLX = cx + Math.cos(baseAngleLeft) * (innerR * 0.95);
    const baseLY = cy + Math.sin(baseAngleLeft) * (innerR * 0.95);
    const baseRX = cx + Math.cos(baseAngleRight) * (innerR * 0.95);
    const baseRY = cy + Math.sin(baseAngleRight) * (innerR * 0.95);

    const rayGrad = ctx.createLinearGradient(cx, cy, tipX, tipY);
    rayGrad.addColorStop(0, '#fef08a');
    rayGrad.addColorStop(0.6, accentColor);
    rayGrad.addColorStop(1, '#b45309');
    ctx.fillStyle = rayGrad;

    ctx.beginPath();
    ctx.moveTo(baseLX, baseLY);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(baseRX, baseRY);
    ctx.closePath();
    ctx.fill();
  }

  // Central Sun disk with gold metallic gradient
  const diskGrad = ctx.createRadialGradient(
    cx - innerR * 0.25,
    cy - innerR * 0.25,
    0,
    cx,
    cy,
    innerR
  );
  diskGrad.addColorStop(0, '#ffffff');
  diskGrad.addColorStop(0.3, '#fef08a');
  diskGrad.addColorStop(0.8, '#f59e0b');
  diskGrad.addColorStop(1, '#b45309');

  ctx.fillStyle = diskGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();

  // Gold outer rim
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw vector miniature Kurdistan map with accurate geographic projection and glowing pinpoint
 */
function drawMiniKurdistanMap(
  ctx: CanvasRenderingContext2D,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  factLat: number,
  factLng: number,
  theme: ThemeConfig,
  cityName: string
) {
  ctx.save();

  // Card container for mini-map
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.strokeStyle = theme.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 20);
  ctx.fill();
  ctx.stroke();

  // Clip to inner container
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(boxX + 2, boxY + 2, boxW - 4, boxH - 4, 18);
  ctx.clip();

  // Draw delicate grid lines inside map
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridStep = 40;
  for (let gx = boxX; gx <= boxX + boxW; gx += gridStep) {
    ctx.beginPath();
    ctx.moveTo(gx, boxY);
    ctx.lineTo(gx, boxY + boxH);
    ctx.stroke();
  }
  for (let gy = boxY; gy <= boxY + boxH; gy += gridStep) {
    ctx.beginPath();
    ctx.moveTo(boxX, gy);
    ctx.lineTo(boxX + boxW, gy);
    ctx.stroke();
  }

  // Map projection helpers
  const { minLat, maxLat, minLng, maxLng } = KURDISTAN_BOUNDS;
  const mapInnerPad = 24;
  const availW = boxW - mapInnerPad * 2;
  const availH = boxH - mapInnerPad * 2;

  const project = (lat: number, lng: number) => {
    const nx = (lng - minLng) / (maxLng - minLng);
    const ny = (maxLat - lat) / (maxLat - minLat); // inverted for canvas
    return {
      x: boxX + mapInnerPad + nx * availW,
      y: boxY + mapInnerPad + ny * availH,
    };
  };

  // Draw Greater Kurdistan boundary silhouette
  if (GREAT_KURDISTAN_POLYGON.length > 2) {
    ctx.beginPath();
    const firstPt = project(GREAT_KURDISTAN_POLYGON[0][0], GREAT_KURDISTAN_POLYGON[0][1]);
    ctx.moveTo(firstPt.x, firstPt.y);

    for (let i = 1; i < GREAT_KURDISTAN_POLYGON.length; i++) {
      const pt = project(GREAT_KURDISTAN_POLYGON[i][0], GREAT_KURDISTAN_POLYGON[i][1]);
      ctx.lineTo(pt.x, pt.y);
    }
    ctx.closePath();

    // Fill silhouette
    ctx.fillStyle = theme.mapFill;
    ctx.fill();

    // Outline stroke with illuminated boundary
    ctx.strokeStyle = theme.mapStroke;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = theme.mapStroke;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0; // reset
  }

  // Draw glowing pinpoint for fact's location
  if (Number.isFinite(factLat) && Number.isFinite(factLng)) {
    const pin = project(factLat, factLng);

    // Outer radar glow
    const radar = ctx.createRadialGradient(pin.x, pin.y, 2, pin.x, pin.y, 24);
    radar.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
    radar.addColorStop(0.5, 'rgba(245, 158, 11, 0.3)');
    radar.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = radar;
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 24, 0, Math.PI * 2);
    ctx.fill();

    // Pin pulse ring
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 11, 0, Math.PI * 2);
    ctx.stroke();

    // Pin solid center dot
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pin.x, pin.y, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore(); // restore clip

  // Mini-map Badge Label (Bottom right or top right)
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.fillStyle = theme.accentLight;
  ctx.font = 'bold 18px "Vazirmatn", "Noto Kufi Arabic", sans-serif';
  ctx.fillText('نەخشەی پێگەی جوگرافی', boxX + boxW - 16, boxY + 28);

  ctx.font = '14px "Vazirmatn", sans-serif';
  ctx.fillStyle = theme.subtextColor;
  const coordText = `${factLat.toFixed(2)}° N, ${factLng.toFixed(2)}° E`;
  ctx.fillText(coordText, boxX + boxW - 16, boxY + 50);

  ctx.restore();
}

/**
 * Word-wrap RTL text helper with line-height and max lines constraint
 */
function wrapRtlText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
): number {
  ctx.direction = 'rtl';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'top';

  // Normalize spaces
  const clean = text.replace(/\s+/g, ' ').trim();
  const words = clean.split(' ');
  let currentLine = '';
  let linesCount = 0;
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      linesCount++;
      if (linesCount >= maxLines) {
        // Truncate last line with ellipsis
        ctx.fillText(`${currentLine}…`, x, currentY);
        return currentY + lineHeight;
      }
      ctx.fillText(currentLine, x, currentY);
      currentLine = words[i];
      currentY += lineHeight;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine && linesCount < maxLines) {
    ctx.fillText(currentLine, x, currentY);
    currentY += lineHeight;
  }

  return currentY;
}

export const SocialCardGeneratorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  fact,
  allFacts = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Customization State
  const [format, setFormat] = useState<CardFormat>('story'); // 9:16 or 1:1
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('royal_gold');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Custom Editable Overrides
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [isEditingText, setIsEditingText] = useState(false);

  // Export / Copy Feedback States
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Available Images for this Fact
  const allImages = useMemo(() => getAllFactImages(fact), [fact]);
  const activeImage = allImages[selectedImageIndex] || allImages[0];

  // Category Information
  const catInfo = useMemo(() => getCategoryInfo(fact), [fact]);
  const currentTheme = THEMES[selectedTheme];

  // Reset custom text when active fact changes
  useEffect(() => {
    if (fact) {
      setCustomTitle(fact.name || '');
      setCustomText(fact.fullText || fact.desc || '');
      setSelectedImageIndex(0);
      setIsEditingText(false);
    }
  }, [fact?.id]);

  // Main Canvas Rendering Pipeline
  const renderCard = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !fact) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas Resolution
    const width = 1080;
    const height = format === 'story' ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Luxurious Gradient Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, currentTheme.bgGradStart);
    bgGrad.addColorStop(0.5, currentTheme.bgGradMid);
    bgGrad.addColorStop(1, currentTheme.bgGradEnd);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle Radial Glow in Center
    const centerGlow = ctx.createRadialGradient(
      width / 2,
      height * 0.35,
      50,
      width / 2,
      height * 0.35,
      width * 0.7
    );
    centerGlow.addColorStop(0, `${currentTheme.accent}18`);
    centerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGlow;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Outer Ornate Frame & Corners
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(30, 30, width - 60, height - 60, 32);
    ctx.stroke();

    // Thin inner hairline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(38, 38, width - 76, height - 76, 26);
    ctx.stroke();

    // 3. Header Section (Sun Logo + Title + Subtitle)
    const headerY = format === 'story' ? 85 : 65;
    // Central Sun of Kurdistan
    drawKurdistanSun(ctx, width / 2, headerY + 45, 34, 15, currentTheme.accent);

    // Branding Title & Subtitle
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.fillStyle = currentTheme.accentLight;
    ctx.font = 'bold 22px "Noto Kufi Arabic", "Vazirmatn", sans-serif';
    ctx.fillText('ئینسایکلۆپیدیای دەسەڵات و شوێنەوارەکانی کوردستان', width / 2, headerY + 95);

    ctx.fillStyle = currentTheme.subtextColor;
    ctx.font = '16px "Vazirmatn", sans-serif';
    ctx.fillText('KURDISTAN HISTORICAL ATLAS · مێژووی شکۆدار و شوێنەوارە دێرینەکان', width / 2, headerY + 125);

    // Thin Gold Divider Line with Diamond Knot
    const divY = headerY + 158;
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(120, divY);
    ctx.lineTo(width / 2 - 30, divY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width / 2 + 30, divY);
    ctx.lineTo(width - 120, divY);
    ctx.stroke();

    // Diamond knot in center
    ctx.fillStyle = currentTheme.accent;
    ctx.beginPath();
    ctx.arc(width / 2, divY, 4, 0, Math.PI * 2);
    ctx.fill();

    // 4. Content Layout depending on Format (Story 9:16 vs Post 1:1)
    if (format === 'story') {
      // ===== STORY (9:16) LAYOUT =====
      const photoX = 60;
      const photoY = divY + 28;
      const photoW = width - 120; // 960px
      const photoH = 700;

      // Draw Hero Photo Box with Rounded Corners
      await drawImageContainer(ctx, photoX, photoY, photoW, photoH, activeImage?.url);

      // Category & Era Badges Overlaid on Hero Image
      drawCategoryOverlay(ctx, photoX, photoY, photoW, photoH, catInfo, fact);

      // Mini Kurdistan Map Locator Bar
      const mapBoxX = 60;
      const mapBoxY = photoY + photoH + 32;
      const mapBoxW = 960;
      const mapBoxH = 260;

      // Half width for map, half width for location text
      const miniMapW = 440;
      drawMiniKurdistanMap(
        ctx,
        mapBoxX + mapBoxW - miniMapW,
        mapBoxY,
        miniMapW,
        mapBoxH,
        fact.lat,
        fact.lng,
        currentTheme,
        fact.desc
      );

      // Location details on the other side of map box
      const infoBoxX = mapBoxX;
      const infoBoxW = mapBoxW - miniMapW - 20;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(infoBoxX, mapBoxY, infoBoxW, mapBoxH, 20);
      ctx.fill();
      ctx.stroke();

      // Info box text
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';

      ctx.fillStyle = currentTheme.accent;
      ctx.font = 'bold 20px "Noto Kufi Arabic", "Vazirmatn", sans-serif';
      ctx.fillText('پێگەی جوگرافی و سەردەم', infoBoxX + infoBoxW - 24, mapBoxY + 26);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Vazirmatn", sans-serif';
      wrapRtlText(
        ctx,
        fact.desc || 'کوردستان',
        infoBoxX + infoBoxW - 24,
        mapBoxY + 62,
        infoBoxW - 48,
        34,
        2
      );

      // Century & Era row
      ctx.fillStyle = currentTheme.accentLight;
      ctx.font = 'bold 18px "Vazirmatn", sans-serif';
      const timeStr = [
        fact.century,
        fact.year ? `${fact.year} زایینی` : '',
        fact.eraName,
      ]
        .filter(Boolean)
        .join(' · ');
      ctx.fillText(timeStr || 'مێژووی دێرین', infoBoxX + infoBoxW - 24, mapBoxY + 145);

      ctx.fillStyle = currentTheme.subtextColor;
      ctx.font = '16px "Vazirmatn", monospace';
      ctx.fillText(
        `هێڵی پان: ${fact.lat.toFixed(3)}° | هێڵی درێژ: ${fact.lng.toFixed(3)}°`,
        infoBoxX + infoBoxW - 24,
        mapBoxY + 185
      );

      // Historical Dossier Title & Text Card
      const textCardY = mapBoxY + mapBoxH + 30;
      const textCardW = 960;
      const textCardH = 430;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(60, textCardY, textCardW, textCardH, 24);
      ctx.fill();
      ctx.stroke();

      // Fact Title
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';

      const title = customTitle || fact.name;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "Noto Kufi Arabic", "Vazirmatn", sans-serif';
      wrapRtlText(ctx, title, 60 + textCardW - 32, textCardY + 28, textCardW - 64, 56, 2);

      // Divider under title
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(92, textCardY + 98);
      ctx.lineTo(60 + textCardW - 32, textCardY + 98);
      ctx.stroke();

      // Historical Description Narrative
      const narrative = customText || fact.fullText || fact.desc;
      ctx.fillStyle = currentTheme.textColor;
      ctx.font = '400 24px "Vazirmatn", sans-serif';
      wrapRtlText(
        ctx,
        narrative,
        60 + textCardW - 32,
        textCardY + 115,
        textCardW - 64,
        42,
        6
      );

      // Footer Bar (Watermark & Website URL)
      const footerY = height - 90;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(80, footerY);
      ctx.lineTo(width - 80, footerY);
      ctx.stroke();

      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.accentLight;
      ctx.font = 'bold 18px "Vazirmatn", sans-serif';
      ctx.fillText('ئەم کارتە بە کوالێتی بەرز تایبەت بە بڵاوکردنەوە لە ستۆری دروستکراوە', width - 80, footerY + 22);

      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillStyle = currentTheme.subtextColor;
      ctx.font = '600 16px "Vazirmatn", sans-serif';
      ctx.fillText('kurdishhistory.app · Kurdistan Historical Atlas', 80, footerY + 22);

    } else {
      // ===== SQUARE (1:1) LAYOUT (1080 x 1080) =====
      const margin = 50;
      const topContentY = divY + 20;

      // Left: Miniature Kurdistan Map (360px wide)
      // Right: Hero Image (580px wide)
      const imageW = 580;
      const imageH = 370;
      const imageX = width - margin - imageW;
      const imageY = topContentY;

      await drawImageContainer(ctx, imageX, imageY, imageW, imageH, activeImage?.url);
      drawCategoryOverlay(ctx, imageX, imageY, imageW, imageH, catInfo, fact);

      // Mini Map on left side
      const miniMapW = width - margin * 2 - imageW - 20;
      const miniMapX = margin;
      const miniMapY = topContentY;
      drawMiniKurdistanMap(
        ctx,
        miniMapX,
        miniMapY,
        miniMapW,
        imageH,
        fact.lat,
        fact.lng,
        currentTheme,
        fact.desc
      );

      // Lower Section: Fact Dossier Card
      const dossierY = imageY + imageH + 20;
      const dossierW = width - margin * 2;
      const dossierH = height - dossierY - 95;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(margin, dossierY, dossierW, dossierH, 24);
      ctx.fill();
      ctx.stroke();

      // Title & Timeline Header
      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';

      const title = customTitle || fact.name;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 38px "Noto Kufi Arabic", "Vazirmatn", sans-serif';
      wrapRtlText(ctx, title, margin + dossierW - 28, dossierY + 24, dossierW - 56, 48, 1);

      // Sub-line: Location and Year
      ctx.fillStyle = currentTheme.accentLight;
      ctx.font = 'bold 18px "Vazirmatn", sans-serif';
      const metaLine = [
        `شوێن: ${fact.desc}`,
        fact.century,
        fact.year ? `${fact.year} ز` : '',
        fact.eraName,
      ]
        .filter(Boolean)
        .join(' · ');
      ctx.fillText(metaLine, margin + dossierW - 28, dossierY + 76);

      // Divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin + 28, dossierY + 110);
      ctx.lineTo(margin + dossierW - 28, dossierY + 110);
      ctx.stroke();

      // Historical narrative text
      const narrative = customText || fact.fullText || fact.desc;
      ctx.fillStyle = currentTheme.textColor;
      ctx.font = '400 22px "Vazirmatn", sans-serif';
      wrapRtlText(
        ctx,
        narrative,
        margin + dossierW - 28,
        dossierY + 125,
        dossierW - 56,
        36,
        6
      );

      // Footer Bar
      const footerY = height - 65;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(60, footerY);
      ctx.lineTo(width - 60, footerY);
      ctx.stroke();

      ctx.direction = 'rtl';
      ctx.textAlign = 'right';
      ctx.fillStyle = currentTheme.accentLight;
      ctx.font = 'bold 16px "Vazirmatn", sans-serif';
      ctx.fillText('ئینسایکلۆپیدیای دەسەڵاتەکانی کوردستان', width - 60, footerY + 16);

      ctx.direction = 'ltr';
      ctx.textAlign = 'left';
      ctx.fillStyle = currentTheme.subtextColor;
      ctx.font = '15px "Vazirmatn", sans-serif';
      ctx.fillText('kurdishhistory.app · 1080x1080 Post', 60, footerY + 16);
    }
  }, [fact, format, selectedTheme, activeImage?.url, customTitle, customText, currentTheme, catInfo]);

  /**
   * Helper to draw image into container with cover scale and graceful fallback
   */
  const drawImageContainer = async (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    imgUrl?: string
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 24);
    ctx.clip();

    // Default rich dark backdrop
    ctx.fillStyle = '#060a12';
    ctx.fillRect(x, y, w, h);

    if (imgUrl) {
      try {
        const loadedImg = await loadImageSafe(getOptimizedImageUrl(imgUrl, 'full'));
        // Cover aspect ratio calculation
        const imgRatio = loadedImg.width / loadedImg.height;
        const boxRatio = w / h;
        let sw = loadedImg.width;
        let sh = loadedImg.height;
        let sx = 0;
        let sy = 0;

        if (imgRatio > boxRatio) {
          sw = loadedImg.height * boxRatio;
          sx = (loadedImg.width - sw) / 2;
        } else {
          sh = loadedImg.width / boxRatio;
          sy = (loadedImg.height - sh) / 2;
        }

        ctx.drawImage(loadedImg, sx, sy, sw, sh, x, y, w, h);
      } catch (err) {
        // Fallback: draw ornate historical emblem if image cannot be loaded
        drawHistoricalVectorFallback(ctx, x, y, w, h);
      }
    } else {
      drawHistoricalVectorFallback(ctx, x, y, w, h);
    }

    // Bottom dark gradient overlay for text readability
    const darkVignette = ctx.createLinearGradient(x, y + h * 0.5, x, y + h);
    darkVignette.addColorStop(0, 'rgba(4, 7, 15, 0)');
    darkVignette.addColorStop(0.7, 'rgba(4, 7, 15, 0.6)');
    darkVignette.addColorStop(1, 'rgba(4, 7, 15, 0.95)');
    ctx.fillStyle = darkVignette;
    ctx.fillRect(x, y, w, h);

    // Frame border
    ctx.restore();
    ctx.strokeStyle = currentTheme.border;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 24);
    ctx.stroke();
  };

  /**
   * Safe Image Loader with CORS Support
   */
  const loadImageSafe = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
  };

  /**
   * Fallback drawing with stylized geometric patterns if no image exists or CORS failed
   */
  const drawHistoricalVectorFallback = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    // Rich radial background
    const rad = ctx.createRadialGradient(x + w / 2, y + h / 2, 20, x + w / 2, y + h / 2, w * 0.6);
    rad.addColorStop(0, '#131e38');
    rad.addColorStop(1, '#050914');
    ctx.fillStyle = rad;
    ctx.fillRect(x, y, w, h);

    // Draw large glowing Kurdistan Sun in center
    drawKurdistanSun(ctx, x + w / 2, y + h / 2 - 15, Math.min(w, h) * 0.28, Math.min(w, h) * 0.12, currentTheme.accent);

    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = currentTheme.accentLight;
    ctx.font = 'bold 22px "Noto Kufi Arabic", "Vazirmatn", sans-serif';
    ctx.fillText('شوێنەوار و دەسەڵاتی مێژوویی', x + w / 2, y + h - 50);
  };

  /**
   * Overlay Category & Era Badges over image
   */
  const drawCategoryOverlay = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    category: { name: string; color: string },
    currentFact: FactItem
  ) => {
    ctx.save();
    // Top-Right: Category Pill with vibrant accent
    const catText = category.name;
    ctx.font = 'bold 20px "Noto Kufi Arabic", "Vazirmatn", sans-serif';
    const textWidth = ctx.measureText(catText).width;
    const badgeW = textWidth + 36;
    const badgeH = 40;
    const badgeX = x + w - badgeW - 20;
    const badgeY = y + 20;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.strokeStyle = category.color || currentTheme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(catText, badgeX + badgeW - 18, badgeY + badgeH / 2);

    // Top-Left: Era / Date Tag
    if (currentFact.century || currentFact.year) {
      const timeTag = currentFact.year || currentFact.century || '';
      ctx.font = 'bold 18px "Vazirmatn", monospace';
      const timeWidth = ctx.measureText(timeTag).width;
      const timeW = timeWidth + 28;
      const timeH = 36;
      const timeX = x + 20;
      const timeY = y + 22;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(timeX, timeY, timeW, timeH, 10);
      ctx.fill();
      ctx.stroke();

      ctx.direction = 'ltr';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = currentTheme.accentLight;
      ctx.fillText(timeTag, timeX + timeW / 2, timeY + timeH / 2);
    }

    ctx.restore();
  };

  // Trigger re-render whenever dependencies change
  useEffect(() => {
    if (isOpen && fact) {
      renderCard();
    }
  }, [isOpen, fact, format, selectedTheme, selectedImageIndex, customTitle, customText, renderCard]);

  // Download Handler (PNG File Export)
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas || !fact) return;

    setIsDownloading(true);
    try {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsDownloading(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          const safeName = fact.name.replace(/[\/\s\\:*?"<>|]/g, '_');
          a.href = url;
          a.download = `kurdish_history_${safeName}_${format}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
        },
        'image/png',
        1.0
      );
    } catch (err) {
      console.error('Error generating card download:', err);
      setIsDownloading(false);
    }
  };

  // Clipboard Copy Handler
  const handleCopyImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } else {
          // Fallback to direct download
          handleDownloadImage();
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Clipboard write failed, downloading instead:', err);
      handleDownloadImage();
    }
  };

  // Native Web Share API Handler
  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !fact) return;

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const safeName = fact.name.replace(/[\/\s\\:*?"<>|]/g, '_');
        const file = new File([blob], `${safeName}.png`, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${fact.name} - ئینسایکلۆپیدیای دەسەڵاتەکانی کوردستان`,
            text: `${fact.name}: ${fact.desc}`,
            files: [file],
          });
          setShared(true);
          setTimeout(() => setShared(false), 2500);
        } else {
          // Fallback to copy or download
          handleCopyImage();
        }
      }, 'image/png');
    } catch (err) {
      console.warn('Share cancelled or not supported:', err);
    }
  };

  if (!isOpen || !fact) return null;

  return (
    <div
      className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-2xl animate-fade-in text-right text-slate-100"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[94vh] glass-dock-2026 rounded-3xl p-4 sm:p-6 shadow-[0_30px_90px_rgba(0,0,0,0.95)] overflow-y-auto custom-scrollbar flex flex-col gap-4 animate-spatial-spring border border-amber-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-heading text-white">
                دروستکەری کارتی سۆشیال میدیا و ستۆری
              </h2>
              <p className="text-xs text-amber-300/80 font-medium">
                بڵاوکردنەوە لە ئینستاگرام، تیکتۆک، فەیسبووک و واتسئەپ بە کواڵیتی بەرز
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
            title="داخستن"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main 2-Column Work Area (Left: Canvas Preview, Right: Controls & Customization) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Card Preview Window (Takes 6 or 7 columns on Desktop) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-black/60 rounded-2xl p-3 border border-white/10 relative overflow-hidden">
            {/* Visual Preview Container */}
            <div className="relative w-full flex items-center justify-center max-h-[52vh] sm:max-h-[58vh] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="max-h-[50vh] sm:max-h-[56vh] w-auto h-auto object-contain rounded-xl shadow-2xl border border-white/15"
                style={{
                  aspectRatio: format === 'story' ? '9/16' : '1/1',
                }}
              />
            </div>

            {/* Resolution indicator pill */}
            <div className="mt-3 flex items-center justify-between w-full px-2 text-[11px] text-slate-400 border-t border-white/5 pt-2">
              <span className="font-mono text-amber-300">
                {format === 'story' ? '1080 × 1920 px (ستۆری)' : '1080 × 1080 px (پۆست)'}
              </span>
              <span className="text-slate-400">کوالێتی ڕەسەنی PNG بۆ چاپ و تۆڕەکان</span>
            </div>
          </div>

          {/* Controls & Options Panel (Takes 6 columns on Desktop) */}
          <div className="lg:col-span-6 space-y-4">
            {/* 1. Format Switcher Tabs (Story vs Square Post) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>شێوازی پێوانەی کارت (Aspect Ratio)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('story')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    format === 'story'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>ستۆری (Story 9:16)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('square')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    format === 'square'
                      ? 'bg-amber-500/25 border-amber-400 text-amber-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Square className="w-4 h-4 text-amber-400" />
                  <span>پۆست (Square 1:1)</span>
                </button>
              </div>
            </div>

            {/* 2. Theme / Style Options */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-amber-400" />
                <span>شێوازی دیزاین و ڕەنگ (Theme)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.values(THEMES).map((thm) => (
                  <button
                    key={thm.id}
                    type="button"
                    onClick={() => setSelectedTheme(thm.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-[11px] font-bold transition-all cursor-pointer ${
                      selectedTheme === thm.id
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-sm'
                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-white/40 shadow-xs"
                      style={{
                        background: `linear-gradient(135deg, ${thm.bgGradMid}, ${thm.accent})`,
                      }}
                    />
                    <span className="truncate max-w-[85px]">{thm.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Image Selection (If multiple images available) */}
            {allImages.length > 1 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-amber-400" />
                    <span>هەڵبژاردنی وێنەی سەر کارتەکە ({allImages.length} وێنە هەیە)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    وێنەی {toKurdishDigits(selectedImageIndex + 1)}
                  </span>
                </label>
                <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar">
                  {allImages.map((img, idx) => (
                    <button
                      key={img.url || idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-14 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? 'border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)] scale-105'
                          : 'border-white/15 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={getOptimizedImageUrl(img.url, 'thumb')}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Text Customizer (Optional override for Title & Narrative) */}
            <div className="space-y-2 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>دەستکاریکردنی دەق بۆ پۆست (ئارەزوومەندانە)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditingText(!isEditingText)}
                  className="text-xs text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  {isEditingText ? 'شاردنەوەی دەستکاری' : 'دەستکاریکردنی تێکست'}
                </button>
              </div>

              {isEditingText && (
                <div className="space-y-2.5 p-3 rounded-xl bg-black/40 border border-white/10 animate-fade-in">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">ناوی سەر کارتەکە:</label>
                    <input
                      type="text"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full liquid-glass-input text-white text-xs p-2 rounded-lg"
                      placeholder="ناوی سەر کارتەکە..."
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">دەقی کورتەی مێژوویی:</label>
                    <textarea
                      rows={3}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      className="w-full liquid-glass-input text-white text-xs p-2 rounded-lg leading-relaxed"
                      placeholder="دەقی مێژوویی سەر کارتەکە..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTitle(fact.name);
                        setCustomText(fact.fullText || fact.desc);
                      }}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-300 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>گەڕانەوە بۆ دەقی بنەڕەتی</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Primary Export Action Buttons */}
            <div className="space-y-2 border-t border-white/10 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Download PNG Button */}
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isDownloading}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl liquid-glass-btn-active text-slate-950 font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-slate-950" />
                  <span>{isDownloading ? 'وێنەکە ئامادە دەکرێت...' : 'داگرتنی وێنە (PNG)'}</span>
                </button>

                {/* Copy Image to Clipboard Button */}
                <button
                  type="button"
                  onClick={handleCopyImage}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl liquid-glass-btn text-slate-200 hover:text-white font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 border border-white/15"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">وێنەکە کۆپیکرا! ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-amber-400" />
                      <span>کۆپیکردنی وێنە</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mobile Web Share Button */}
              {'share' in navigator && (
                <button
                  type="button"
                  onClick={handleShare}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer border border-white/10"
                >
                  <Share2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>هاوبەشکردنی ڕاستەوخۆ لە ئینستاگرام، واتسئەپ یان تیکتۆک</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
