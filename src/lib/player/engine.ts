import { dbToGain, FREQS } from "@/lib/player/presets";

export type EngineSnap = {
  playing: boolean;
  position: number;
  duration: number;
};

type Listener = (snap: EngineSnap) => void;

const FREQ_BIN = new Uint8Array(512);
const WAVE_BIN = new Uint8Array(1024);

class Engine {
  private ctx: AudioContext | null = null;
  private preamp: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private volume: GainNode | null = null;
  private panner: StereoPannerNode | null = null;
  private analyser: AnalyserNode | null = null;
  private media: HTMLAudioElement | null = null;
  private mediaNode: MediaElementAudioSourceNode | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private mode: "idle" | "buffer" | "media" = "idle";
  private playing = false;
  private offset = 0;
  private startedAt = 0;
  private suppressEnd = false;
  private timer = 0;
  private pendingVol = 0.8;
  private pendingPan = 0;
  private pendingEq = { on: true, pre: 0, bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
  private listeners = new Set<Listener>();
  onEnded: (() => void) | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snap());
    return () => this.listeners.delete(listener);
  }

  private snap(): EngineSnap {
    return {
      playing: this.playing,
      position: this.position(),
      duration: this.duration(),
    };
  }

  private emit() {
    const snap = this.snap();
    for (const listener of this.listeners) listener(snap);
  }

  unlock(): Promise<void> {
    const ctx = this.ensure();
    return ctx.resume();
  }

  private ensure(): AudioContext {
    if (this.ctx) return this.ctx;
    const ctx = new AudioContext();
    const preamp = ctx.createGain();
    const volume = ctx.createGain();
    const panner = ctx.createStereoPanner();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.72;
    volume.gain.value = this.pendingVol;
    panner.pan.value = this.pendingPan;
    const filters = FREQS.map((freq) => {
      const filter = ctx.createBiquadFilter();
      filter.type = "peaking";
      filter.frequency.value = freq;
      filter.Q.value = 1.15;
      filter.gain.value = 0;
      return filter;
    });
    let node: AudioNode = preamp;
    for (const filter of filters) {
      node.connect(filter);
      node = filter;
    }
    node.connect(volume);
    volume.connect(panner);
    panner.connect(analyser);
    analyser.connect(ctx.destination);
    const media = new Audio();
    media.preload = "auto";
    media.crossOrigin = "anonymous";
    media.addEventListener("ended", () => {
      if (this.mode !== "media" || this.suppressEnd) return;
      this.playing = false;
      this.stopClock();
      this.emit();
      this.onEnded?.();
    });
    media.addEventListener("durationchange", () => this.emit());
    this.ctx = ctx;
    this.preamp = preamp;
    this.filters = filters;
    this.volume = volume;
    this.panner = panner;
    this.analyser = analyser;
    this.media = media;
    this.applyEq();
    return ctx;
  }

  private chainInput(): AudioNode {
    if (!this.preamp) throw new Error("Audio is not ready");
    return this.preamp;
  }

  private applyEq() {
    if (!this.preamp) return;
    this.preamp.gain.value = this.pendingEq.on ? dbToGain(this.pendingEq.pre) : 1;
    this.filters.forEach((filter, index) => {
      filter.gain.value = this.pendingEq.on ? (this.pendingEq.bands[index] ?? 0) : 0;
    });
  }

  setEq(on: boolean, preDb: number, bands: number[]) {
    this.pendingEq = { on, pre: preDb, bands: bands.slice(0, 10) };
    this.applyEq();
  }

  setVolume(value: number) {
    this.pendingVol = value;
    if (this.volume) this.volume.gain.value = value;
  }

  setBalance(value: number) {
    this.pendingPan = value;
    if (this.panner) this.panner.pan.value = value;
  }

  isPlaying(): boolean {
    return this.playing;
  }

  hasTrack(): boolean {
    return this.mode !== "idle";
  }

  position(): number {
    if (this.mode === "media" && this.media) return this.media.currentTime || 0;
    if (this.mode === "buffer" && this.playing && this.ctx) {
      return Math.min(this.duration(), this.ctx.currentTime - this.startedAt);
    }
    return this.offset;
  }

  duration(): number {
    if (this.mode === "media" && this.media && Number.isFinite(this.media.duration)) {
      return this.media.duration;
    }
    if (this.buffer) return this.buffer.duration;
    return 0;
  }

  getDuration(): number {
    return this.duration();
  }

  private startClock() {
    if (this.timer) return;
    this.timer = window.setInterval(() => this.emit(), 200);
  }

  private stopClock() {
    if (!this.timer) return;
    window.clearInterval(this.timer);
    this.timer = 0;
  }

  private haltBuffer() {
    if (!this.source) return;
    this.suppressEnd = true;
    try {
      this.source.stop();
    } catch {
      /* already stopped */
    }
    this.source.disconnect();
    this.source = null;
    this.suppressEnd = false;
  }

  private startBuffer(offset: number) {
    if (!this.ctx || !this.buffer) return;
    this.haltBuffer();
    const source = this.ctx.createBufferSource();
    source.buffer = this.buffer;
    source.connect(this.chainInput());
    const clamped = Math.min(Math.max(0, offset), Math.max(0, this.buffer.duration - 0.05));
    source.onended = () => {
      if (this.suppressEnd || this.source !== source) return;
      this.playing = false;
      this.offset = this.duration();
      this.source = null;
      this.stopClock();
      this.emit();
      this.onEnded?.();
    };
    source.start(0, clamped);
    this.source = source;
    this.startedAt = this.ctx.currentTime - clamped;
    this.offset = clamped;
    this.playing = true;
    this.startClock();
    this.emit();
  }

  async playBuffer(buffer: AudioBuffer) {
    const ctx = this.ensure();
    await ctx.resume();
    if (this.media) {
      this.media.pause();
    }
    this.buffer = buffer;
    this.mode = "buffer";
    this.offset = 0;
    this.startBuffer(0);
  }

  async playUrl(url: string) {
    const ctx = this.ensure();
    await ctx.resume();
    this.haltBuffer();
    const media = this.media;
    if (!media) return;
    if (!this.mediaNode) {
      this.mediaNode = ctx.createMediaElementSource(media);
      this.mediaNode.connect(this.chainInput());
    }
    this.mode = "media";
    this.buffer = null;
    if (media.dataset.loaded !== url) {
      media.dataset.loaded = url;
      media.src = url;
    }
    media.currentTime = 0;
    await media.play();
    this.playing = true;
    this.startClock();
    this.emit();
  }

  pause() {
    if (!this.playing) return;
    if (this.mode === "media" && this.media) this.media.pause();
    if (this.mode === "buffer") {
      this.offset = this.position();
      this.haltBuffer();
    }
    this.playing = false;
    this.stopClock();
    this.emit();
  }

  async resume() {
    if (this.playing) return;
    await this.unlock();
    if (this.mode === "media" && this.media) {
      await this.media.play();
      this.playing = true;
      this.startClock();
      this.emit();
      return;
    }
    if (this.mode === "buffer" && this.buffer) {
      const restartAt = this.offset >= this.buffer.duration - 0.05 ? 0 : this.offset;
      this.startBuffer(restartAt);
    }
  }

  stop() {
    if (this.mode === "media" && this.media) {
      this.media.pause();
      this.media.currentTime = 0;
    }
    if (this.mode === "buffer") {
      this.haltBuffer();
      this.offset = 0;
    }
    this.playing = false;
    this.stopClock();
    this.emit();
  }

  seek(seconds: number) {
    const dur = this.duration();
    const next = Math.min(Math.max(0, seconds), dur || seconds);
    if (this.mode === "media" && this.media) {
      this.media.currentTime = next;
      this.emit();
      return;
    }
    if (this.mode === "buffer") {
      this.offset = next;
      if (this.playing) this.startBuffer(next);
      else this.emit();
    }
  }

  freq(): Uint8Array {
    if (!this.analyser) return FREQ_BIN;
    this.analyser.getByteFrequencyData(FREQ_BIN.subarray(0, this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>);
    return FREQ_BIN;
  }

  wave(): Uint8Array {
    if (!this.analyser) return WAVE_BIN;
    this.analyser.getByteTimeDomainData(WAVE_BIN as Uint8Array<ArrayBuffer>);
    return WAVE_BIN;
  }
}

export const engine = new Engine();
