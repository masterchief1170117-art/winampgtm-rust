import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { EqWindow } from "@/components/player/EqWindow";
import { MainWindow } from "@/components/player/MainWindow";
import { PlaylistWindow } from "@/components/player/PlaylistWindow";
import { bindEngine, usePlayer } from "@/lib/player/store";
import { fmt } from "@/lib/player/time";

export function Player() {
  const fileRef = useRef<HTMLInputElement>(null);
  const retired = usePlayer((s) => s.retired);
  const showPl = usePlayer((s) => s.showPl);
  const playing = usePlayer((s) => s.playing);
  const position = usePlayer((s) => s.position);
  const current = usePlayer((s) => s.current);
  const tracks = usePlayer((s) => s.tracks);
  const track = tracks.find((item) => item.id === current);

  useEffect(() => {
    usePlayer.getState().hydrate();
    return bindEngine();
  }, []);

  useEffect(() => {
    const previous = document.title;
    document.title = track ? `${track.artist} — ${track.title} · Wimampgtm` : "Wimampgtm";
    return () => {
      document.title = previous;
    };
  }, [track]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.getAttribute("role") === "slider")) {
        return;
      }
      const state = usePlayer.getState();
      const key = event.key;
      if (key === " " || key.startsWith("Arrow")) event.preventDefault();
      if (key === " ") state.toggle();
      else if (key === "z" || key === "ArrowLeft") state.seek(Math.max(0, state.position - 5));
      else if (key === "b" || key === "ArrowRight") state.seek(state.position + 5);
      else if (key === "x") state.pressPlay();
      else if (key === "c") state.pause();
      else if (key === "v" && !event.metaKey && !event.ctrlKey) state.stop();
      else if (key === "n") state.next(false);
      else if (key === "ArrowUp") state.setVolume(Math.min(1, state.volume + 0.05));
      else if (key === "ArrowDown") state.setVolume(Math.max(0, state.volume - 0.05));
      else if (key === "r") state.cycleRepeat();
      else if (key === "s") state.toggleShuffle();
      else if (key === "q") state.toggleEqWin();
      else if (key === "p") state.togglePlWin();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openFiles() {
    fileRef.current?.click();
  }

  return (
    <div
      className={showPl && !retired ? "desk split" : "desk"}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        if (event.dataTransfer.files.length) void usePlayer.getState().addFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) void usePlayer.getState().addFiles(event.target.files);
          event.target.value = "";
        }}
      />
      {retired ? (
        <div className="dock-pill">
          <button type="button" className="win-btn" aria-label="Restore player" onClick={() => usePlayer.getState().restore()}>
            +
          </button>
          <span className="wordmark">WIMAMP</span>
          <span className="gtm-chip">GTM</span>
          <span className="digits">{fmt(position)}</span>
          <button type="button" className={`t-btn${playing ? " on" : ""}`} aria-label={playing ? "Pause" : "Play"} onClick={() => usePlayer.getState().toggle()}>
            <Play />
          </button>
        </div>
      ) : (
        <>
          <MainWindow onOpen={openFiles} />
          <EqWindow />
          <PlaylistWindow onOpen={openFiles} />
        </>
      )}
      <p className="desk-hint">
        Space plays. Z X C V B are the old transport keys. Click the visor. Drop audio to add it.{" "}
        <Link to="/rust">Rust version</Link>
      </p>
    </div>
  );
}
