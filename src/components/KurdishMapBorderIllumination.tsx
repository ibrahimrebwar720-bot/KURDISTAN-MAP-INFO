import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { GREAT_KURDISTAN_POLYGON } from '../data/kurdishHistoryData';

interface Props {
  map: L.Map | null;
  isActive: boolean;
  onComplete: () => void;
  durationMs?: number; // 4000ms
}

export const KurdishMapBorderIllumination: React.FC<Props> = ({
  map,
  isActive,
  onComplete,
  durationMs = 4000,
}) => {
  const [svgPathD, setSvgPathD] = useState<string>('');
  const [centerPos, setCenterPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Hardware-accelerated refs (0 React re-renders during the 4-second 120 FPS animation)
  const containerRef = useRef<HTMLDivElement>(null);
  const darkOverlayRef = useRef<HTMLDivElement>(null);
  const softBorderPathRef = useRef<SVGPathElement>(null);
  const glowLayer1Ref = useRef<SVGPathElement>(null);
  const glowLayer2Ref = useRef<SVGPathElement>(null);
  const glowLayer3Ref = useRef<SVGPathElement>(null);
  const fillPolygonRef = useRef<SVGPathElement>(null);
  const outerDiffuseGroupRef = useRef<SVGGElement>(null);

  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Compute SVG Polygon Path from real Leaflet coordinates
  const updatePathGeometry = useCallback(() => {
    if (!map) return;

    try {
      const points = GREAT_KURDISTAN_POLYGON.map(([lat, lng]) => {
        const pt = map.latLngToContainerPoint(L.latLng(lat, lng));
        return { x: pt.x, y: pt.y };
      });

      if (points.length < 3) return;

      let d = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x.toFixed(1)},${points[i].y.toFixed(1)}`;
      }
      d += ' Z';
      setSvgPathD(d);

      // Geographical heart of Kurdistan (Erbil / Dukan area)
      const c = map.latLngToContainerPoint(L.latLng(36.19, 44.01));
      setCenterPos({ x: c.x, y: c.y });
    } catch (err) {
      console.warn('Error projecting map coordinates:', err);
    }
  }, [map]);

  // Handle map frame bounds & coordinate updates
  useEffect(() => {
    if (!map || !isActive) return;

    // Center and frame all of Kurdistan gently so the full map is visible
    const kurdistanBounds = L.latLngBounds(GREAT_KURDISTAN_POLYGON);
    map.fitBounds(kurdistanBounds, {
      padding: [25, 25],
      maxZoom: 6.2,
      animate: false,
    });

    updatePathGeometry();

    const onMapChange = () => {
      updatePathGeometry();
    };

    map.on('move', onMapChange);
    map.on('zoom', onMapChange);
    map.on('resize', onMapChange);

    return () => {
      map.off('move', onMapChange);
      map.off('zoom', onMapChange);
      map.off('resize', onMapChange);
    };
  }, [map, isActive, updatePathGeometry]);

  // Main 120 FPS Animation Loop: Soft light emerging from the border and diffusing outward
  useEffect(() => {
    if (!isActive || !svgPathD) return;

    const darkOverlay = darkOverlayRef.current;
    const softBorder = softBorderPathRef.current;
    const glow1 = glowLayer1Ref.current;
    const glow2 = glowLayer2Ref.current;
    const glow3 = glowLayer3Ref.current;
    const fillPoly = fillPolygonRef.current;
    const diffuseGroup = outerDiffuseGroupRef.current;

    startTimeRef.current = null;

    // Reset initial styles
    if (darkOverlay) darkOverlay.style.opacity = '1';
    if (softBorder) softBorder.style.opacity = '0';
    if (glow1) glow1.style.opacity = '0';
    if (glow2) glow2.style.opacity = '0';
    if (glow3) glow3.style.opacity = '0';
    if (fillPoly) fillPoly.style.opacity = '0';
    if (diffuseGroup) diffuseGroup.style.opacity = '0';

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);

      // Phases of the 4-second soft light emergence:
      // 0.0 -> 0.2 (0ms - 800ms): Soft golden border awakes gently from darkness
      // 0.2 -> 0.75 (800ms - 3000ms): Soft warm light expands outward from the border across the map
      // 0.75 -> 1.0 (3000ms - 4000ms): Full radiant revelation, veil softly dissipates to 0

      // 1. Core soft border opacity (emerges smoothly)
      if (softBorder) {
        let borderOpacity = 0;
        if (progress < 0.2) {
          borderOpacity = (progress / 0.2) * 0.9;
        } else if (progress < 0.75) {
          borderOpacity = 0.9;
        } else {
          // Softly settle
          borderOpacity = 0.9 - ((progress - 0.75) / 0.25) * 0.5;
        }
        softBorder.style.opacity = borderOpacity.toFixed(3);
      }

      // 2. Outward diffusing light wave 1 (near aura, width expands from 10px to 36px)
      if (glow1) {
        let g1Progress = Math.max(0, (progress - 0.08) / 0.85);
        let g1Opacity = 0;
        if (progress < 0.25) {
          g1Opacity = (progress / 0.25) * 0.75;
        } else if (progress < 0.75) {
          g1Opacity = 0.75 + Math.sin(progress * Math.PI * 2) * 0.1;
        } else {
          g1Opacity = Math.max(0, 0.75 * (1 - (progress - 0.75) / 0.25));
        }
        const strokeW = 12 + g1Progress * 24;
        glow1.setAttribute('stroke-width', strokeW.toFixed(1));
        glow1.style.opacity = g1Opacity.toFixed(3);
      }

      // 3. Outward diffusing light wave 2 (mid aura, width expands from 20px to 80px)
      if (glow2) {
        let g2Progress = Math.max(0, (progress - 0.15) / 0.8);
        let g2Opacity = 0;
        if (progress < 0.35) {
          g2Opacity = ((progress - 0.15) / 0.2) * 0.6;
        } else if (progress < 0.75) {
          g2Opacity = 0.6;
        } else {
          g2Opacity = Math.max(0, 0.6 * (1 - (progress - 0.75) / 0.25));
        }
        const strokeW2 = 24 + g2Progress * 56;
        glow2.setAttribute('stroke-width', strokeW2.toFixed(1));
        glow2.style.opacity = Math.max(0, g2Opacity).toFixed(3);
      }

      // 4. Outward deep ambient diffusion wave 3 (far aura, width expands from 40px to 160px)
      if (glow3) {
        let g3Progress = Math.max(0, (progress - 0.25) / 0.7);
        let g3Opacity = 0;
        if (progress < 0.45) {
          g3Opacity = ((progress - 0.25) / 0.2) * 0.45;
        } else if (progress < 0.8) {
          g3Opacity = 0.45;
        } else {
          g3Opacity = Math.max(0, 0.45 * (1 - (progress - 0.8) / 0.2));
        }
        const strokeW3 = 50 + g3Progress * 110;
        glow3.setAttribute('stroke-width', strokeW3.toFixed(1));
        glow3.style.opacity = Math.max(0, g3Opacity).toFixed(3);
      }

      // 5. Interior soft warm glow fill of Kurdistan
      if (fillPoly) {
        let fillOpacity = 0;
        if (progress < 0.3) {
          fillOpacity = (progress / 0.3) * 0.16;
        } else if (progress < 0.8) {
          fillOpacity = 0.16;
        } else {
          fillOpacity = 0.16 * (1 - (progress - 0.8) / 0.2);
        }
        fillPoly.style.opacity = fillOpacity.toFixed(3);
      }

      // 6. Deep dark backdrop smoothly dissolves into full light
      if (darkOverlay) {
        let veilOpacity = 1;
        if (progress < 0.15) {
          veilOpacity = 1;
        } else if (progress < 0.8) {
          // Softly thinning as light spreads outward
          const spreadProg = (progress - 0.15) / 0.65;
          // Smooth sinusoidal ease
          veilOpacity = 1 - Math.sin(spreadProg * (Math.PI / 2)) * 0.75;
        } else {
          // Final dissipation to complete clarity
          const endProg = (progress - 0.8) / 0.2;
          veilOpacity = 0.25 * (1 - endProg);
        }
        darkOverlay.style.opacity = Math.max(0, veilOpacity).toFixed(3);
      }

      if (progress < 1) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        if (darkOverlay) darkOverlay.style.opacity = '0';
        onComplete();
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isActive, svgPathD, durationMs, onComplete]);

  // Immediate Skip
  const handleSkip = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
    }
    if (darkOverlayRef.current) {
      darkOverlayRef.current.style.opacity = '0';
    }
    onComplete();
  }, [onComplete]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      onClick={handleSkip}
      className="absolute inset-0 w-full h-full pointer-events-auto cursor-pointer z-20 overflow-hidden select-none"
    >
      {/* 1. Deep Midnight Backdrop - seamlessly melts away as soft light spreads */}
      <div
        ref={darkOverlayRef}
        className="absolute inset-0 bg-[#050811] pointer-events-none"
        style={{ opacity: 1, willChange: 'opacity' }}
      />

      {/* 2. Soft Light Layer directly on real Leaflet Map */}
      {svgPathD && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ willChange: 'opacity' }}
        >
          <defs>
            {/* Soft Gaussian blur filters for silky outward light diffusion */}
            <filter id="softDiffusionFar" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
            </filter>

            <filter id="softDiffusionMid" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="22" />
            </filter>

            <filter id="softDiffusionNear" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
            </filter>

            <filter id="gentleBorderGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" />
            </filter>

            {/* Radiant soft golden wash */}
            <radialGradient id="kurdistanAuraGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
              <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="75%" stopColor="#d97706" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Layer A: Far Outward Light Bloom (Spreads far across the map from the border) */}
          <path
            ref={glowLayer3Ref}
            d={svgPathD}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={50}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softDiffusionFar)"
            opacity={0}
            style={{ willChange: 'opacity, stroke-width' }}
          />

          {/* Layer B: Mid Outward Light Bloom (Spreads outward from the border) */}
          <path
            ref={glowLayer2Ref}
            d={svgPathD}
            fill="none"
            stroke="#fbbf24"
            strokeWidth={24}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softDiffusionMid)"
            opacity={0}
            style={{ willChange: 'opacity, stroke-width' }}
          />

          {/* Layer C: Near Soft Glow (Hugging the perimeter with warm radiance) */}
          <path
            ref={glowLayer1Ref}
            d={svgPathD}
            fill="none"
            stroke="#fef08a"
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#softDiffusionNear)"
            opacity={0}
            style={{ willChange: 'opacity, stroke-width' }}
          />

          {/* Layer D: Soft Kurdistan Interior Warm Wash */}
          <path
            ref={fillPolygonRef}
            d={svgPathD}
            fill="#f59e0b"
            opacity={0}
            style={{ willChange: 'opacity' }}
          />

          {/* Layer E: Soft, Non-Harsh Kurdistan Border Line (ڕووناکیی نەرمی سنور) */}
          <path
            ref={softBorderPathRef}
            d={svgPathD}
            fill="none"
            stroke="#fef3c7"
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#gentleBorderGlow)"
            opacity={0}
            style={{ willChange: 'opacity' }}
          />
        </svg>
      )}

    </div>
  );
};

