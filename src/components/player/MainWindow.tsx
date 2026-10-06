import { FolderOpen, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Square } from "lucide-react";
import { Visor } from "@/components/player/Visor";
import { fmt } from "@/lib/player/time";
import { usePlayer } from "@/lib/player/store";

export function MainWindow({ onOpen }: { onOpen: () => void }) {
  const shadeMain = usePlayer((s) => s.shadeMain);
  const retired = usePlayer((s) => s.retired);
  const playing = usePlayer((s) => s.playing);
  const loading = usePlayer((s) => s.loading);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const balance = usePlayer((s) => s.balance);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const showEq = usePlayer((s) => s.showEq);
  const showPl = usePlayer((s) => s.showPl);
  const vis = usePlayer((s) => s.vis);
  const error = usePlayer((s) => s.error);
  const sleepLeft = usePlayer((s) => s.sleepLeft);
  const tracks = usePlayer((s) => s.tracks);
  const current = usePlayer((s) => s.current);
  const track = tracks.find((item) => item.id === current) ?? null;
  const index = track ? tracks.findIndex((item) => item.id === track.id) : -1;
  const ticker = error
    ? error
    : loading
      ? "Loading…"
      : track
        ? `${track.artist}  -  ${track.title}   ${index + 1}/${tracks.length}`
        : "WIMAMP GTM  -  stock skin  -  press play";

  if (retired) return null;

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <section className="skin-win main-win" aria-label="Main player">
      <header className="skin-title">
        <h1 className="wordmark">WIMAMP</h1>
        <span className="gtm-chip">GTM</span>
        <span className="title-fill">{shadeMain ? ticker : "STOCK"}</span>
        <div className="win-btns">
          <button type="button" className="win-btn" aria-label="Shade main window" onClick={() => usePlayer.getState().toggleShade("main")}>
            _
          </button>
          <button type="button" className="win-btn" aria-label="Minimize player" onClick={() => usePlayer.getState().retire()}>
            ×
          </button>
        </div>
      </header>
      {!shadeMain && (
        <div className="skin-body">
          <div className="lcd-row">
            <div className="clutter">
              <button type="button" className="mini-btn" aria-label="Open audio files" onClick={onOpen}>
                <FolderOpen size={14} />
              </button>
            </div>
            <div className="ticker-well" aria-live="polite">
              <span className={playing ? "ticker-track" : undefined}>{ticker}</span>
            </div>
            <div className="digits-well">
              <span className="digits">{fmt(position)}</span>
              <span className="digits-sub">{sleepLeft != null ? `Z ${fmt(sleepLeft)}` : fmt(duration)}</span>
            </div>
          </div>
          <div className="main-stage">
            <Visor mode={vis} playing={playing} onCycle={() => usePlayer.getState().cycleVis()} />
          </div>
          <div className="readout">
            <span>
              <b>STEREO</b>
            </span>
            <span>{track?.kind === "file" ? "FILE" : "SYNTH"}</span>
            <span>44 KHZ</span>
          </div>
          <div className="seek">
            <label className="slider-line">
              <span>SEEK</span>
              <input
                className="skin-range"
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={Math.min(position, duration || 0)}
                aria-label="Seek"
                style={{ ["--pct" as string]: `${pct}%` }}
                onPointerDown={() => usePlayer.getState().setScrubbing(true)}
                onPointerUp={(event) => {
                  usePlayer.getState().setScrubbing(false);
                  usePlayer.getState().seek(Number(event.currentTarget.value));
                }}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (usePlayer.getState().scrubbing) usePlayer.setState({ position: value });
                  else usePlayer.getState().seek(value);
                }}
              />
            </label>
          </div>
          <div className="transport">
            <button type="button" className="t-btn" aria-label="Previous" onClick={() => usePlayer.getState().prev()}>
              <SkipBack />
            </button>
            <button type="button" className={`t-btn${playing ? " on" : ""}`} aria-label="Play" onClick={() => usePlayer.getState().pressPlay()}>
              <Play />
            </button>
            <button type="button" className="t-btn" aria-label="Pause" onClick={() => usePlayer.getState().pause()}>
              <Pause />
            </button>
            <button type="button" className="t-btn" aria-label="Stop" onClick={() => usePlayer.getState().stop()}>
              <Square />
            </button>
            <button type="button" className="t-btn" aria-label="Next" onClick={() => usePlayer.getState().next(false)}>
              <SkipForward />
            </button>
            <div className="slider-stack">
              <label className="slider-line">
                <span>VOL</span>
                <input
                  className="skin-range"
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  aria-label="Volume"
                  style={{ ["--pct" as string]: `${volume * 100}%` }}
                  onChange={(event) => usePlayer.getState().setVolume(Number(event.target.value))}
                />
              </label>
              <label className="slider-line">
                <span>BAL</span>
                <input
                  className="skin-range"
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={balance}
                  aria-label="Balance"
                  style={{ ["--pct" as string]: `${((balance + 1) / 2) * 100}%` }}
                  onChange={(event) => usePlayer.getState().setBalance(Number(event.target.value))}
                />
              </label>
            </div>
            <button
              type="button"
              className={`t-btn${shuffle ? " on" : ""}`}
              aria-pressed={shuffle}
              aria-label="Shuffle"
              onClick={() => usePlayer.getState().toggleShuffle()}
            >
              <Shuffle />
            </button>
            <button
              type="button"
              className={`t-btn${repeat !== "off" ? " on" : ""}`}
              aria-pressed={repeat !== "off"}
              aria-label={`Repeat ${repeat}`}
              onClick={() => usePlayer.getState().cycleRepeat()}
            >
              <Repeat />
              {repeat === "one" ? "1" : ""}
            </button>
            <div className="side-toggles">
              <button type="button" className={`tool-btn${showEq ? " on" : ""}`} aria-pressed={showEq} onClick={() => usePlayer.getState().toggleEqWin()}>
                EQ
              </button>
              <button type="button" className={`tool-btn${showPl ? " on" : ""}`} aria-pressed={showPl} onClick={() => usePlayer.getState().togglePlWin()}>
                PL
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
