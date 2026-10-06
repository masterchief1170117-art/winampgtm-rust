import { useEffect, useRef } from "react";
import { engine } from "@/lib/player/engine";
import type { VisMode } from "@/lib/player/store";

const BARS = 24;

export function Visor({ mode, playing, onCycle }: { mode: VisMode; playing: boolean; onCycle: () => void }) {
  const barsRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<SVGPolylineElement>(null);

  useEffect(() => {
    const peaks = Array.from({ length: BARS }, () => 0);
    let frame = 0;
    const tick = () => {
      frame = window.requestAnimationFrame(tick);
      const bars = barsRef.current;
      const scope = scopeRef.current;
      if (!bars || !scope) return;
      const idle = !playing || mode === "off";
      bars.style.display = mode === "scope" ? "none" : "flex";
      scope.style.display = mode === "scope" ? "block" : "none";
      if (idle) {
        for (const child of bars.children) {
          (child as HTMLElement).style.height = "2px";
        }
        scope.setAttribute("points", "0,50 100,50");
        return;
      }
      if (mode === "scope") {
        const wave = engine.wave();
        const step = Math.max(1, Math.floor(wave.length / 64));
        let points = "";
        let x = 0;
        for (let i = 0; i < wave.length; i += step) {
          const y = ((wave[i] ?? 128) / 255) * 100;
          points += `${x.toFixed(1)},${y.toFixed(1)} `;
          x += 100 / (wave.length / step);
        }
        scope.setAttribute("points", points);
        return;
      }
      const bins = engine.freq();
      for (let i = 0; i < BARS; i++) {
        const start = Math.floor((i / BARS) * 70);
        const end = Math.floor(((i + 1) / BARS) * 70);
        let peak = 0;
        for (let b = start; b <= end; b++) peak = Math.max(peak, bins[b] ?? 0);
        const level = peak / 255;
        peaks[i] = Math.max(level, (peaks[i] ?? 0) * 0.9);
        const child = bars.children[i] as HTMLElement | undefined;
        if (child) child.style.height = `${Math.max(2, peaks[i]! * 100)}%`;
      }
    };
    tick();
    return () => window.cancelAnimationFrame(frame);
  }, [mode, playing]);

  return (
    <div
      className="visor"
      role="button"
      tabIndex={0}
      aria-label={`Visualization ${mode}. Activate to change.`}
      onClick={onCycle}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onCycle();
        }
      }}
    >
      <div className="bars" ref={barsRef}>
        {Array.from({ length: BARS }, (_, index) => (
          <span key={index} />
        ))}
      </div>
      <svg className="scope" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polyline ref={scopeRef} points="0,50 100,50" style={{ display: "none" }} />
      </svg>
    </div>
  );
}
