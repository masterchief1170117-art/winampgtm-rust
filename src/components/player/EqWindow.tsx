import { useEffect, useRef, useState } from "react";
import { FREQ_LABELS, PRESET_NAMES } from "@/lib/player/presets";
import { usePlayer } from "@/lib/player/store";

function Fader({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const hit = useRef<HTMLDivElement>(null);
  const pct = ((value + 12) / 24) * 100;

  function fromPointer(clientY: number) {
    const el = hit.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const t = 1 - (clientY - rect.top) / rect.height;
    const next = Math.round((-12 + Math.min(1, Math.max(0, t)) * 24) * 2) / 2;
    onChange(next);
  }

  return (
    <div className="fader">
      <div
        ref={hit}
        className="fader-hit"
        role="slider"
        tabIndex={0}
        aria-valuemin={-12}
        aria-valuemax={12}
        aria-valuenow={value}
        aria-label={label}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          fromPointer(event.clientY);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientY);
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowUp") onChange(Math.min(12, value + 1));
          if (event.key === "ArrowDown") onChange(Math.max(-12, value - 1));
        }}
      >
        <div className="fader-groove" />
        <div className="fader-thumb" style={{ bottom: `calc(${pct}% - 5px)` }} />
      </div>
      <span className="fader-label">{label}</span>
    </div>
  );
}

export function EqWindow() {
  const showEq = usePlayer((s) => s.showEq);
  const shadeEq = usePlayer((s) => s.shadeEq);
  const eqOn = usePlayer((s) => s.eqOn);
  const preset = usePlayer((s) => s.preset);
  const bands = usePlayer((s) => s.bands);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  if (!showEq) return null;

  return (
    <section className="skin-win eq-win" aria-label="Equalizer">
      <header className="skin-title">
        <h2 className="wordmark">EQ</h2>
        <span className="title-fill">{preset.toUpperCase()}</span>
        <div className="win-btns">
          <button type="button" className="win-btn" aria-label="Shade equalizer" onClick={() => usePlayer.getState().toggleShade("eq")}>
            _
          </button>
          <button type="button" className="win-btn" aria-label="Close equalizer" onClick={() => usePlayer.getState().toggleEqWin()}>
            ×
          </button>
        </div>
      </header>
      {!shadeEq && (
        <div className="skin-body">
          <div className="eq-top">
            <button type="button" className={`tool-btn${eqOn ? " on" : ""}`} aria-pressed={eqOn} onClick={() => usePlayer.getState().toggleEq()}>
              ON
            </button>
            <button
              type="button"
              className={`tool-btn${preset === "Auto" ? " on" : ""}`}
              aria-pressed={preset === "Auto"}
              onClick={() => usePlayer.getState().toggleAuto()}
            >
              AUTO
            </button>
            <div className="menu-wrap" ref={wrap}>
              <button type="button" className="tool-btn" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
                {preset}
              </button>
              {open && (
                <div className="menu" role="menu">
                  {PRESET_NAMES.map((name) => (
                    <button
                      key={name}
                      type="button"
                      role="menuitemradio"
                      aria-checked={preset === name}
                      onClick={() => {
                        usePlayer.getState().applyPreset(name);
                        setOpen(false);
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="fader-row">
            <div className="scale" aria-hidden="true">
              <span>+12</span>
              <span>0</span>
              <span>-12</span>
            </div>
            <Fader label="PRE" value={bands[0] ?? 0} onChange={(value) => usePlayer.getState().setBand(0, value)} />
            {FREQ_LABELS.map((label, index) => (
              <Fader
                key={label}
                label={label}
                value={bands[index + 1] ?? 0}
                onChange={(value) => usePlayer.getState().setBand(index + 1, value)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
