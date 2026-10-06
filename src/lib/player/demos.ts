export type DemoSpec = {
  id: string;
  artist: string;
  title: string;
  bpm: number;
  bars: number;
  root: number;
  vibe: "night" | "break" | "soft" | "acid" | "dub" | "piano";
};

export const DEMOS: DemoSpec[] = [
  { id: "midnight", artist: "Ana Voss", title: "Midnight Circuit", bpm: 98, bars: 8, root: 45, vibe: "night" },
  { id: "harbor", artist: "Harbor Line", title: "Teardrop Delay", bpm: 84, bars: 8, root: 40, vibe: "dub" },
  { id: "pier", artist: "North Pier", title: "Glass Box", bpm: 112, bars: 8, root: 52, vibe: "break" },
  { id: "kite", artist: "Kite Audio", title: "Silver Room", bpm: 90, bars: 8, root: 48, vibe: "soft" },
  { id: "silt", artist: "Silt", title: "Low Tide", bpm: 76, bars: 8, root: 36, vibe: "dub" },
  { id: "field", artist: "Field Notes", title: "Eple Tape", bpm: 104, bars: 8, root: 55, vibe: "piano" },
  { id: "soft", artist: "Soft Circuit", title: "Destiny Lane", bpm: 94, bars: 8, root: 43, vibe: "soft" },
  { id: "ledger", artist: "Night Ledger", title: "Blonde Static", bpm: 120, bars: 8, root: 50, vibe: "acid" },
];

export function demoDuration(demo: DemoSpec): number {
  return (demo.bars * 4 * 60) / demo.bpm;
}

const cache = new Map<string, Promise<AudioBuffer>>();

function midi(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * 0.4);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function kick(ctx: OfflineAudioContext, dest: AudioNode, time: number, vol: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(170, time);
  osc.frequency.exponentialRampToValueAtTime(46, time + 0.09);
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
  osc.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + 0.26);
}

function hat(
  ctx: OfflineAudioContext,
  noise: AudioBuffer,
  dest: AudioNode,
  time: number,
  vol: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6500;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.045);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(time);
  src.stop(time + 0.05);
}

function snare(
  ctx: OfflineAudioContext,
  noise: AudioBuffer,
  dest: AudioNode,
  time: number,
  vol: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 1800;
  filter.Q.value = 0.7;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(vol, time);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.16);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(time);
  src.stop(time + 0.18);
}

function tone(
  ctx: OfflineAudioContext,
  dest: AudioNode,
  time: number,
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  cutoff: number,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, time);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), time + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(0.05, dur));
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  osc.start(time);
  osc.stop(time + dur + 0.03);
}

function render(spec: DemoSpec): Promise<AudioBuffer> {
  const seconds = demoDuration(spec) + 0.2;
  const ctx = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
  const master = ctx.createGain();
  master.gain.value = 0.85;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value = 8;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.005;
  comp.release.value = 0.18;
  master.connect(comp);
  comp.connect(ctx.destination);
  const noise = noiseBuffer(ctx);
  const beat = 60 / spec.bpm;
  const steps = spec.bars * 4 * 2;
  const bassType: OscillatorType = spec.vibe === "acid" ? "sawtooth" : "square";
  const leadType: OscillatorType = spec.vibe === "piano" ? "triangle" : "sawtooth";

  for (let step = 0; step < steps; step++) {
    const time = step * (beat / 2);
    const beatIndex = Math.floor(step / 2);
    const down = step % 2 === 0;
    if (spec.vibe !== "piano" && down) kick(ctx, master, time, spec.vibe === "soft" ? 0.35 : 0.7);
    if (step % 2 === 1) hat(ctx, noise, master, time, spec.vibe === "break" ? 0.18 : 0.1);
    if (down && beatIndex % 4 === 2 && spec.vibe !== "piano") {
      snare(ctx, noise, master, time, 0.28);
    }
    if (down && beatIndex % 2 === 0) {
      const degree = [0, 0, 7, 3, 5, 0, 10, 7][beatIndex % 8] ?? 0;
      tone(ctx, master, time, midi(spec.root + degree), beat * 1.4, bassType, 0.22, 280);
    }
    if (spec.vibe === "piano" || spec.vibe === "soft") {
      if (down && beatIndex % 4 === 0) {
        for (const interval of [0, 3, 7]) {
          tone(ctx, master, time, midi(spec.root + 12 + interval), beat * 3.2, "triangle", 0.1, 1800);
        }
      }
    } else if (step % 2 === 0) {
      const arp = [0, 3, 7, 12, 7, 3, 10, 12][step % 8] ?? 0;
      tone(
        ctx,
        master,
        time,
        midi(spec.root + 12 + arp),
        beat * 0.7,
        leadType,
        spec.vibe === "acid" ? 0.12 : 0.08,
        spec.vibe === "acid" ? 900 : 2200,
      );
    }
  }

  return ctx.startRendering();
}

export function renderDemo(id: string): Promise<AudioBuffer> {
  const spec = DEMOS.find((demo) => demo.id === id);
  if (!spec) return Promise.reject(new Error("Missing demo"));
  let pending = cache.get(id);
  if (!pending) {
    pending = render(spec);
    cache.set(id, pending);
  }
  return pending;
}
