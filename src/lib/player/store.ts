import { create } from "zustand";
import { DEMOS, demoDuration, renderDemo } from "@/lib/player/demos";
import { engine } from "@/lib/player/engine";
import { AUTO_CURVE, PRESETS } from "@/lib/player/presets";

export type Track = {
  id: string;
  artist: string;
  title: string;
  duration: number;
  kind: "demo" | "file";
  demoId?: string;
  url?: string;
  fileName?: string;
};

type RepeatMode = "off" | "all" | "one";
export type VisMode = "spectrum" | "scope" | "off";

type Persisted = {
  volume: number;
  balance: number;
  shuffle: boolean;
  repeat: RepeatMode;
  eqOn: boolean;
  bands: number[];
  preset: string;
  showEq: boolean;
  showPl: boolean;
  vis: VisMode;
};

const STOCK_BANDS = PRESETS.Flat ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

function stockTracks(): Track[] {
  return DEMOS.map((demo) => ({
    id: demo.id,
    artist: demo.artist,
    title: demo.title,
    duration: demoDuration(demo),
    kind: "demo" as const,
    demoId: demo.id,
  }));
}

let ready = false;
let token = 0;
let sleepTimer = 0;

function snapshot(state: PlayerState): Persisted {
  return {
    volume: state.volume,
    balance: state.balance,
    shuffle: state.shuffle,
    repeat: state.repeat,
    eqOn: state.eqOn,
    bands: state.bands,
    preset: state.preset,
    showEq: state.showEq,
    showPl: state.showPl,
    vis: state.vis,
  };
}

function persist(state: PlayerState) {
  if (!ready || typeof window === "undefined") return;
  localStorage.setItem("wimampgtm", JSON.stringify(snapshot(state)));
}

function pushEq(eqOn: boolean, bands: number[]) {
  engine.setEq(eqOn, bands[0] ?? 0, bands.slice(1));
}

type PlayerState = Persisted & {
  tracks: Track[];
  current: string | null;
  selected: string | null;
  playing: boolean;
  position: number;
  duration: number;
  loading: boolean;
  error: string | null;
  shadeMain: boolean;
  shadeEq: boolean;
  shadePl: boolean;
  retired: boolean;
  sleepLeft: number | null;
  scrubbing: boolean;
  hydrate: () => void;
  pressPlay: () => void;
  pause: () => void;
  stop: () => void;
  toggle: () => void;
  playAt: (index: number) => Promise<void>;
  next: (fromEnd?: boolean) => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setScrubbing: (value: boolean) => void;
  setVolume: (value: number) => void;
  setBalance: (value: number) => void;
  setBand: (index: number, value: number) => void;
  applyPreset: (name: string) => void;
  toggleEq: () => void;
  toggleAuto: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  cycleVis: () => void;
  toggleEqWin: () => void;
  togglePlWin: () => void;
  toggleShade: (which: "main" | "eq" | "pl") => void;
  retire: () => void;
  restore: () => void;
  select: (id: string) => void;
  addFiles: (files: FileList | File[]) => Promise<void>;
  removeSelected: () => void;
  selectAll: () => void;
  selectNone: () => void;
  sortByTitle: () => void;
  restoreDemos: () => void;
  clearPlaylist: () => void;
  exportM3u: () => void;
  armSleep: (minutes: number | null) => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  tracks: stockTracks(),
  current: null,
  selected: DEMOS[0]?.id ?? null,
  playing: false,
  position: 0,
  duration: DEMOS[0] ? demoDuration(DEMOS[0]) : 0,
  loading: false,
  error: null,
  volume: 0.8,
  balance: 0,
  shuffle: false,
  repeat: "off",
  eqOn: true,
  bands: [...STOCK_BANDS],
  preset: "Flat",
  showEq: true,
  showPl: true,
  vis: "spectrum",
  shadeMain: false,
  shadeEq: false,
  shadePl: false,
  retired: false,
  sleepLeft: null,
  scrubbing: false,

  hydrate: () => {
    ready = true;
    try {
      const raw = localStorage.getItem("wimampgtm");
      if (!raw) return;
      const saved = JSON.parse(raw) as Partial<Persisted>;
      const bands =
        Array.isArray(saved.bands) && saved.bands.length === 11 ? saved.bands.map(Number) : get().bands;
      const volume = typeof saved.volume === "number" ? saved.volume : get().volume;
      const balance = typeof saved.balance === "number" ? saved.balance : get().balance;
      set({
        volume,
        balance,
        shuffle: Boolean(saved.shuffle),
        repeat: saved.repeat === "all" || saved.repeat === "one" ? saved.repeat : "off",
        eqOn: saved.eqOn !== false,
        bands,
        preset: typeof saved.preset === "string" ? saved.preset : "Flat",
        showEq: saved.showEq !== false,
        showPl: saved.showPl !== false,
        vis: saved.vis === "scope" || saved.vis === "off" ? saved.vis : "spectrum",
      });
      engine.setVolume(volume);
      engine.setBalance(balance);
      pushEq(saved.eqOn !== false, bands);
    } catch {
      /* ignore broken storage */
    }
  },

  pressPlay: () => {
    const { tracks, selected, current } = get();
    const id = selected || current || tracks[0]?.id;
    if (!id) return;
    if (id === current && engine.hasTrack() && !engine.isPlaying()) {
      void engine.unlock();
      void engine.resume();
      return;
    }
    const index = tracks.findIndex((track) => track.id === id);
    if (index >= 0) void get().playAt(index);
  },

  pause: () => engine.pause(),
  stop: () => engine.stop(),
  toggle: () => {
    if (engine.isPlaying()) engine.pause();
    else get().pressPlay();
  },

  playAt: async (index) => {
    const mine = ++token;
    const track = get().tracks[index];
    if (!track) return;
    set({ current: track.id, selected: track.id, error: null, loading: true, duration: track.duration });
    try {
      await engine.unlock();
      if (mine !== token) return;
      engine.setVolume(get().volume);
      engine.setBalance(get().balance);
      pushEq(get().eqOn, get().bands);
      if (track.kind === "demo" && track.demoId) {
        const buffer = await renderDemo(track.demoId);
        if (mine !== token) return;
        await engine.playBuffer(buffer);
      } else if (track.url) {
        if (mine !== token) return;
        await engine.playUrl(track.url);
      }
      if (mine !== token) return;
      set({ loading: false, duration: engine.getDuration() || track.duration });
    } catch (error) {
      if (mine !== token) return;
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Playback failed",
      });
    }
  },

  next: (fromEnd = false) => {
    const { tracks, current, shuffle, repeat } = get();
    if (tracks.length === 0) return;
    const index = Math.max(0, tracks.findIndex((track) => track.id === current));
    if (tracks.length === 1) {
      if (fromEnd && repeat === "off" && !shuffle) {
        engine.stop();
        return;
      }
      void get().playAt(0);
      return;
    }
    let next = index;
    if (shuffle) {
      do {
        next = Math.floor(Math.random() * tracks.length);
      } while (next === index);
    } else {
      next = index + 1;
      if (next >= tracks.length) {
        if (fromEnd && repeat === "off") {
          engine.stop();
          return;
        }
        next = 0;
      }
    }
    void get().playAt(next);
  },

  prev: () => {
    const { tracks, current } = get();
    if (tracks.length === 0) return;
    if (engine.position() > 2) {
      engine.seek(0);
      return;
    }
    const index = Math.max(0, tracks.findIndex((track) => track.id === current));
    const prev = index <= 0 ? tracks.length - 1 : index - 1;
    void get().playAt(prev);
  },

  seek: (seconds) => engine.seek(seconds),
  setScrubbing: (value) => set({ scrubbing: value }),

  setVolume: (value) => {
    engine.setVolume(value);
    set({ volume: value });
    persist(get());
  },

  setBalance: (value) => {
    engine.setBalance(value);
    set({ balance: value });
    persist(get());
  },

  setBand: (index, value) => {
    const bands = get().bands.slice();
    bands[index] = value;
    set({ bands, preset: "Manual" });
    pushEq(get().eqOn, bands);
    persist(get());
  },

  applyPreset: (name) => {
    const curve = PRESETS[name];
    if (!curve) return;
    const bands = [...curve];
    set({ bands, preset: name, eqOn: true });
    pushEq(true, bands);
    persist(get());
  },

  toggleEq: () => {
    const eqOn = !get().eqOn;
    set({ eqOn });
    pushEq(eqOn, get().bands);
    persist(get());
  },

  toggleAuto: () => {
    const auto = get().preset === "Auto";
    if (auto) {
      const bands = [...STOCK_BANDS];
      set({ bands, preset: "Flat" });
      pushEq(get().eqOn, bands);
    } else {
      const bands = [...AUTO_CURVE];
      set({ bands, preset: "Auto", eqOn: true });
      pushEq(true, bands);
    }
    persist(get());
  },

  toggleShuffle: () => {
    set({ shuffle: !get().shuffle });
    persist(get());
  },

  cycleRepeat: () => {
    const order: RepeatMode[] = ["off", "all", "one"];
    const next = order[(order.indexOf(get().repeat) + 1) % order.length] ?? "off";
    set({ repeat: next });
    persist(get());
  },

  cycleVis: () => {
    const order: VisMode[] = ["spectrum", "scope", "off"];
    const vis = order[(order.indexOf(get().vis) + 1) % order.length] ?? "spectrum";
    set({ vis });
    persist(get());
  },

  toggleEqWin: () => {
    set({ showEq: !get().showEq, shadeEq: false });
    persist(get());
  },

  togglePlWin: () => {
    set({ showPl: !get().showPl, shadePl: false });
    persist(get());
  },

  toggleShade: (which) => {
    if (which === "main") set({ shadeMain: !get().shadeMain });
    if (which === "eq") set({ shadeEq: !get().shadeEq });
    if (which === "pl") set({ shadePl: !get().shadePl });
  },

  retire: () => set({ retired: true }),
  restore: () => set({ retired: false, shadeMain: false }),

  select: (id) => set({ selected: id }),

  addFiles: async (list) => {
    const files = [...list].filter((file) => file.type.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name));
    const added: Track[] = [];
    for (const file of files) {
      const url = URL.createObjectURL(file);
      const duration = await probe(url);
      const split = file.name.replace(/\.[^.]+$/, "").split(/\s+-\s+/);
      const artist = split.length > 1 ? split[0] : "Local";
      const title = split.length > 1 ? split.slice(1).join(" - ") : split[0] || file.name;
      added.push({
        id: `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`,
        artist: artist || "Local",
        title: title || file.name,
        duration,
        kind: "file",
        url,
        fileName: file.name,
      });
    }
    if (added.length === 0) return;
    set({ tracks: [...get().tracks, ...added], selected: added[0]?.id ?? get().selected });
  },

  removeSelected: () => {
    const { tracks, selected, current } = get();
    if (!selected) return;
    const removed = tracks.find((track) => track.id === selected);
    if (removed?.url) URL.revokeObjectURL(removed.url);
    const nextTracks = tracks.filter((track) => track.id !== selected);
    if (current === selected) {
      token += 1;
      engine.stop();
    }
    set({
      tracks: nextTracks,
      selected: nextTracks[0]?.id ?? null,
      current: current === selected ? null : current,
    });
  },

  selectAll: () => {
    const last = get().tracks[get().tracks.length - 1];
    if (last) set({ selected: last.id });
  },

  selectNone: () => set({ selected: null }),

  sortByTitle: () => {
    const tracks = [...get().tracks].sort((a, b) =>
      `${a.artist} ${a.title}`.localeCompare(`${b.artist} ${b.title}`),
    );
    set({ tracks });
  },

  restoreDemos: () => {
    const have = new Set(get().tracks.map((track) => track.id));
    const missing = stockTracks().filter((track) => !have.has(track.id));
    set({ tracks: [...get().tracks, ...missing] });
  },

  clearPlaylist: () => {
    token += 1;
    engine.stop();
    for (const track of get().tracks) {
      if (track.url) URL.revokeObjectURL(track.url);
    }
    set({ tracks: [], current: null, selected: null, playing: false, position: 0 });
  },

  exportM3u: () => {
    const lines = ["#EXTM3U"];
    for (const track of get().tracks) {
      lines.push(`#EXTINF:${Math.round(track.duration)},${track.artist} - ${track.title}`);
      lines.push(track.fileName || track.demoId || track.title);
    }
    const blob = new Blob([lines.join("\n")], { type: "audio/x-mpegurl" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "wimampgtm.m3u";
    link.click();
    URL.revokeObjectURL(url);
  },

  armSleep: (minutes) => {
    if (sleepTimer) window.clearInterval(sleepTimer);
    sleepTimer = 0;
    if (minutes == null) {
      set({ sleepLeft: null });
      return;
    }
    let left = minutes * 60;
    set({ sleepLeft: left });
    sleepTimer = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        window.clearInterval(sleepTimer);
        sleepTimer = 0;
        engine.pause();
        set({ sleepLeft: null });
      } else {
        set({ sleepLeft: left });
      }
    }, 1000);
  },
}));

function probe(url: string): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.src = url;
    audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
    audio.onerror = () => resolve(0);
  });
}

export function bindEngine() {
  engine.onEnded = () => {
    const state = usePlayer.getState();
    if (state.repeat === "one") {
      engine.seek(0);
      void engine.resume();
      return;
    }
    state.next(true);
  };
  return engine.subscribe((snap) => {
    const state = usePlayer.getState();
    if (state.scrubbing) {
      usePlayer.setState({ playing: snap.playing });
      return;
    }
    usePlayer.setState({
      playing: snap.playing,
      position: snap.position,
      duration: snap.duration || state.duration,
    });
  });
}
