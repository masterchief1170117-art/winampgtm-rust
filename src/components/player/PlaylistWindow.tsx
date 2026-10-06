import { useEffect, useRef, useState, type ReactNode } from "react";
import { fmt } from "@/lib/player/time";
import { usePlayer } from "@/lib/player/store";

function Menu({
  label,
  children,
}: {
  label: string;
  children: (close: () => void) => ReactNode;
}) {
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
  return (
    <div className="menu-wrap" ref={wrap}>
      <button type="button" className="tool-btn" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {label}
      </button>
      {open && (
        <div className="menu" role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function PlaylistWindow({ onOpen }: { onOpen: () => void }) {
  const showPl = usePlayer((s) => s.showPl);
  const shadePl = usePlayer((s) => s.shadePl);
  const tracks = usePlayer((s) => s.tracks);
  const current = usePlayer((s) => s.current);
  const selected = usePlayer((s) => s.selected);
  const total = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);

  if (!showPl) return null;

  return (
    <section className="skin-win pl-win" aria-label="Playlist">
      <header className="skin-title">
        <h2 className="wordmark">PL</h2>
        <span className="title-fill">PLAYLIST</span>
        <div className="win-btns">
          <button type="button" className="win-btn" aria-label="Shade playlist" onClick={() => usePlayer.getState().toggleShade("pl")}>
            _
          </button>
          <button type="button" className="win-btn" aria-label="Close playlist" onClick={() => usePlayer.getState().togglePlWin()}>
            ×
          </button>
        </div>
      </header>
      {!shadePl && (
        <div className="skin-body">
          {tracks.length === 0 ? (
            <p className="empty-list">Empty. ADD a file, or LIST → restore demos.</p>
          ) : (
            <ul className="list">
              {tracks.map((track, index) => (
                <li key={track.id}>
                  <button
                    type="button"
                    className={`row${track.id === current ? " now" : ""}${track.id === selected && track.id !== current ? " sel" : ""}`}
                    onClick={() => {
                      if (usePlayer.getState().selected === track.id) void usePlayer.getState().playAt(index);
                      else usePlayer.getState().select(track.id);
                    }}
                    onDoubleClick={() => void usePlayer.getState().playAt(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>
                      {track.artist} — {track.title}
                      <br />
                      <small>{track.kind === "file" ? "local file" : "stock demo"}</small>
                    </span>
                    <span className="when">{fmt(track.duration)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="plist-foot">
            <span>
              {tracks.length} tracks · {fmt(total)}
            </span>
          </div>
          <div className="plist-tools">
            <button type="button" className="tool-btn" onClick={onOpen}>
              ADD
            </button>
            <button type="button" className="tool-btn" onClick={() => usePlayer.getState().removeSelected()}>
              REM
            </button>
            <Menu label="SEL">
              {(close) => (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      const id = usePlayer.getState().current;
                      if (id) usePlayer.getState().select(id);
                      close();
                    }}
                  >
                    Playing
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().selectNone();
                      close();
                    }}
                  >
                    None
                  </button>
                </>
              )}
            </Menu>
            <Menu label="MISC">
              {(close) => (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().sortByTitle();
                      close();
                    }}
                  >
                    Sort by title
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().armSleep(15);
                      close();
                    }}
                  >
                    Sleep 15 min
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().armSleep(30);
                      close();
                    }}
                  >
                    Sleep 30 min
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().armSleep(null);
                      close();
                    }}
                  >
                    Sleep off
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().exportM3u();
                      close();
                    }}
                  >
                    Export m3u
                  </button>
                </>
              )}
            </Menu>
            <Menu label="LIST">
              {(close) => (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().restoreDemos();
                      close();
                    }}
                  >
                    Restore demos
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      usePlayer.getState().clearPlaylist();
                      close();
                    }}
                  >
                    Clear list
                  </button>
                </>
              )}
            </Menu>
          </div>
        </div>
      )}
    </section>
  );
}
