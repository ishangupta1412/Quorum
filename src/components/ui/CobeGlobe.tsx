'use client';
import { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

interface GlobeArc {
  from: [number, number];
  to: [number, number];
}
interface GlobeMarker {
  location: [number, number];
  size: number;
}

interface CobeGlobeProps {
  markers?: GlobeMarker[];
  arcs?: GlobeArc[];
  className?: string;
  speed?: number;
  onClusterClick?: () => void;
}

const ATTACK_MARKERS: GlobeMarker[] = [
  { location: [55.75, 37.62],  size: 0.05 }, // Moscow (attacker origin)
  { location: [47.61, -122.33], size: 0.04 }, // Seattle (target)
  { location: [51.51, -0.12],  size: 0.03 }, // London (proxy)
  { location: [35.68, 139.69], size: 0.03 }, // Tokyo (proxy)
  { location: [1.35, 103.82],  size: 0.03 }, // Singapore (proxy)
  { location: [50.11, 8.68],   size: 0.02 }, // Frankfurt (proxy)
  { location: [19.08, 72.88],  size: 0.02 }, // Mumbai (proxy)
];

const ATTACK_ARCS: GlobeArc[] = [
  { from: [55.75, 37.62],  to: [47.61, -122.33] },
  { from: [51.51, -0.12],  to: [47.61, -122.33] },
  { from: [35.68, 139.69], to: [47.61, -122.33] },
  { from: [1.35, 103.82],  to: [47.61, -122.33] },
  { from: [50.11, 8.68],   to: [47.61, -122.33] },
  { from: [19.08, 72.88],  to: [47.61, -122.33] },
];

export function CobeGlobe({ markers = ATTACK_MARKERS, arcs = ATTACK_ARCS, className = '', speed = 0.004, onClusterClick }: CobeGlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phiRef = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let globe: ReturnType<typeof createGlobe>;

    const init = () => {
      const w = canvas.offsetWidth;
      if (w === 0) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width: w * 2,
        height: w * 2,
        phi: 0,
        theta: 0.25,
        dark: 1,
        diffuse: 1.8,
        mapSamples: 20000,
        mapBrightness: 6,
        baseColor: [0.02, 0.02, 0.04],
        markerColor: [0.86, 0.15, 0.15],
        glowColor: [0.5, 0.05, 0.05],
        markers: markers.map(m => ({ location: m.location, size: m.size })),
      });

      const animate = () => {
        phiRef.current += speed;
        globe.update({ phi: phiRef.current });
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);

      canvas.style.opacity = '1';
    };

    const timeout = setTimeout(init, 100);

    return () => {
      clearTimeout(timeout);
      cancelAnimationFrame(frameRef.current);
      globe?.destroy();
    };
  }, [markers, speed]);

  return (
    <div
      className={`relative aspect-square ${className}`}
      onClick={onClusterClick}
      style={{ cursor: onClusterClick ? 'pointer' : 'default' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: 0,
          transition: 'opacity 1.4s ease',
          borderRadius: '50%',
        }}
      />
      {/* Attack arcs overlay label */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono text-slate-400 tracking-widest uppercase pointer-events-none">
        {arcs.length} attack vectors active
      </div>
    </div>
  );
}
