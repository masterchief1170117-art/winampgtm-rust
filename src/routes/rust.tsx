import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/rust")({ component: RustPlayer });

type RustApi = ((input?: { module_or_path: string }) => Promise<unknown>) & {
  start: () => void;
  stop: () => void;
};

function rustApi(): RustApi | undefined {
  return (window as Window & { wimampgtm?: RustApi }).wimampgtm;
}

function RustPlayer() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;

    const boot = () => {
      const api = rustApi();
      if (!api) {
        if (!dead) setError("Rust player failed to load");
        return;
      }
      void api({ module_or_path: "/rust/wimampgtm_bg.wasm" })
        .then(() => {
          if (dead) {
            api.stop();
            return;
          }
          api.start();
        })
        .catch((cause: unknown) => {
          if (!dead) setError(cause instanceof Error ? cause.message : "Rust player failed to load");
        });
    };

    let script = document.querySelector<HTMLScriptElement>("script[data-wimamp-rust]");
    if (!script) {
      script = document.createElement("script");
      script.src = "/rust/wimampgtm.js";
      script.dataset.wimampRust = "1";
      document.head.appendChild(script);
    }
    if (rustApi()) boot();
    else script.addEventListener("load", boot);
    return () => {
      dead = true;
      script?.removeEventListener("load", boot);
      rustApi()?.stop();
    };
  }, []);

  return (
    <main>
      <p className="desk-hint rust-back">
        <Link to="/">JS skin</Link>
        <span> · Rust build of the stock skin</span>
      </p>
      {error ? <p className="desk-hint">{error}</p> : null}
      <div id="wimamp-rust">
        <p className="desk-hint">Loading the Rust player…</p>
      </div>
    </main>
  );
}
