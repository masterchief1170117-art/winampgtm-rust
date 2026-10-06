import { i as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Shuffle, c as Pause, i as SkipBack, l as FolderOpen, n as Square, o as Repeat, r as SkipForward, s as Play } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BeExA4z9.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var FREQS = [
	60,
	170,
	310,
	600,
	1e3,
	3e3,
	6e3,
	12e3,
	14e3,
	16e3
];
var FREQ_LABELS = [
	"60",
	"170",
	"310",
	"600",
	"1K",
	"3K",
	"6K",
	"12K",
	"14K",
	"16K"
];
/** Index 0 is preamp. The next ten are the graphic bands, in dB. */
var PRESETS = {
	Flat: [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	],
	Rock: [
		0,
		5,
		3,
		-1,
		-2,
		-1,
		2,
		4,
		5,
		5,
		5
	],
	Dance: [
		0,
		6,
		4,
		1,
		0,
		-1,
		-1,
		0,
		3,
		4,
		4
	],
	Pop: [
		0,
		-1,
		2,
		4,
		4,
		2,
		0,
		-1,
		-1,
		-1,
		-1
	],
	Classical: [
		0,
		4,
		3,
		2,
		1,
		-1,
		-1,
		0,
		2,
		3,
		4
	],
	Bass: [
		2,
		7,
		6,
		4,
		2,
		0,
		0,
		0,
		0,
		0,
		0
	],
	Treble: [
		0,
		0,
		0,
		0,
		0,
		1,
		3,
		5,
		6,
		7,
		7
	],
	Vocal: [
		0,
		-2,
		-1,
		1,
		3,
		4,
		4,
		2,
		0,
		-1,
		-2
	],
	Laptop: [
		3,
		4,
		5,
		3,
		0,
		-2,
		-1,
		1,
		3,
		4,
		3
	],
	Soft: [
		-2,
		2,
		1,
		0,
		-1,
		-1,
		0,
		1,
		2,
		2,
		1
	]
};
var PRESET_NAMES = Object.keys(PRESETS);
var AUTO_CURVE = [
	1,
	3,
	2,
	1,
	0,
	-1,
	0,
	1,
	2,
	3,
	3
];
function dbToGain(db) {
	return Math.pow(10, db / 20);
}
var DEMOS = [
	{
		id: "midnight",
		artist: "Ana Voss",
		title: "Midnight Circuit",
		bpm: 98,
		bars: 8,
		root: 45,
		vibe: "night"
	},
	{
		id: "harbor",
		artist: "Harbor Line",
		title: "Teardrop Delay",
		bpm: 84,
		bars: 8,
		root: 40,
		vibe: "dub"
	},
	{
		id: "pier",
		artist: "North Pier",
		title: "Glass Box",
		bpm: 112,
		bars: 8,
		root: 52,
		vibe: "break"
	},
	{
		id: "kite",
		artist: "Kite Audio",
		title: "Silver Room",
		bpm: 90,
		bars: 8,
		root: 48,
		vibe: "soft"
	},
	{
		id: "silt",
		artist: "Silt",
		title: "Low Tide",
		bpm: 76,
		bars: 8,
		root: 36,
		vibe: "dub"
	},
	{
		id: "field",
		artist: "Field Notes",
		title: "Eple Tape",
		bpm: 104,
		bars: 8,
		root: 55,
		vibe: "piano"
	},
	{
		id: "soft",
		artist: "Soft Circuit",
		title: "Destiny Lane",
		bpm: 94,
		bars: 8,
		root: 43,
		vibe: "soft"
	},
	{
		id: "ledger",
		artist: "Night Ledger",
		title: "Blonde Static",
		bpm: 120,
		bars: 8,
		root: 50,
		vibe: "acid"
	}
];
function demoDuration(demo) {
	return demo.bars * 4 * 60 / demo.bpm;
}
var cache = /* @__PURE__ */ new Map();
function midi(note) {
	return 440 * Math.pow(2, (note - 69) / 12);
}
function noiseBuffer(ctx) {
	const length = Math.floor(ctx.sampleRate * .4);
	const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
	return buffer;
}
function kick(ctx, dest, time, vol) {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = "sine";
	osc.frequency.setValueAtTime(170, time);
	osc.frequency.exponentialRampToValueAtTime(46, time + .09);
	gain.gain.setValueAtTime(vol, time);
	gain.gain.exponentialRampToValueAtTime(1e-4, time + .24);
	osc.connect(gain);
	gain.connect(dest);
	osc.start(time);
	osc.stop(time + .26);
}
function hat(ctx, noise, dest, time, vol) {
	const src = ctx.createBufferSource();
	src.buffer = noise;
	const filter = ctx.createBiquadFilter();
	filter.type = "highpass";
	filter.frequency.value = 6500;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(vol, time);
	gain.gain.exponentialRampToValueAtTime(1e-4, time + .045);
	src.connect(filter);
	filter.connect(gain);
	gain.connect(dest);
	src.start(time);
	src.stop(time + .05);
}
function snare(ctx, noise, dest, time, vol) {
	const src = ctx.createBufferSource();
	src.buffer = noise;
	const filter = ctx.createBiquadFilter();
	filter.type = "bandpass";
	filter.frequency.value = 1800;
	filter.Q.value = .7;
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(vol, time);
	gain.gain.exponentialRampToValueAtTime(1e-4, time + .16);
	src.connect(filter);
	filter.connect(gain);
	gain.connect(dest);
	src.start(time);
	src.stop(time + .18);
}
function tone(ctx, dest, time, freq, dur, type, vol, cutoff) {
	const osc = ctx.createOscillator();
	osc.type = type;
	osc.frequency.setValueAtTime(freq, time);
	const filter = ctx.createBiquadFilter();
	filter.type = "lowpass";
	filter.frequency.setValueAtTime(cutoff, time);
	const gain = ctx.createGain();
	gain.gain.setValueAtTime(1e-4, time);
	gain.gain.exponentialRampToValueAtTime(Math.max(2e-4, vol), time + .02);
	gain.gain.exponentialRampToValueAtTime(1e-4, time + Math.max(.05, dur));
	osc.connect(filter);
	filter.connect(gain);
	gain.connect(dest);
	osc.start(time);
	osc.stop(time + dur + .03);
}
function render(spec) {
	const seconds = demoDuration(spec) + .2;
	const ctx = new OfflineAudioContext(2, Math.ceil(44100 * seconds), 44100);
	const master = ctx.createGain();
	master.gain.value = .85;
	const comp = ctx.createDynamicsCompressor();
	comp.threshold.value = -12;
	comp.knee.value = 8;
	comp.ratio.value = 3.5;
	comp.attack.value = .005;
	comp.release.value = .18;
	master.connect(comp);
	comp.connect(ctx.destination);
	const noise = noiseBuffer(ctx);
	const beat = 60 / spec.bpm;
	const steps = spec.bars * 4 * 2;
	const bassType = spec.vibe === "acid" ? "sawtooth" : "square";
	const leadType = spec.vibe === "piano" ? "triangle" : "sawtooth";
	for (let step = 0; step < steps; step++) {
		const time = step * (beat / 2);
		const beatIndex = Math.floor(step / 2);
		const down = step % 2 === 0;
		if (spec.vibe !== "piano" && down) kick(ctx, master, time, spec.vibe === "soft" ? .35 : .7);
		if (step % 2 === 1) hat(ctx, noise, master, time, spec.vibe === "break" ? .18 : .1);
		if (down && beatIndex % 4 === 2 && spec.vibe !== "piano") snare(ctx, noise, master, time, .28);
		if (down && beatIndex % 2 === 0) {
			const degree = [
				0,
				0,
				7,
				3,
				5,
				0,
				10,
				7
			][beatIndex % 8] ?? 0;
			tone(ctx, master, time, midi(spec.root + degree), beat * 1.4, bassType, .22, 280);
		}
		if (spec.vibe === "piano" || spec.vibe === "soft") {
			if (down && beatIndex % 4 === 0) for (const interval of [
				0,
				3,
				7
			]) tone(ctx, master, time, midi(spec.root + 12 + interval), beat * 3.2, "triangle", .1, 1800);
		} else if (step % 2 === 0) {
			const arp = [
				0,
				3,
				7,
				12,
				7,
				3,
				10,
				12
			][step % 8] ?? 0;
			tone(ctx, master, time, midi(spec.root + 12 + arp), beat * .7, leadType, spec.vibe === "acid" ? .12 : .08, spec.vibe === "acid" ? 900 : 2200);
		}
	}
	return ctx.startRendering();
}
function renderDemo(id) {
	const spec = DEMOS.find((demo) => demo.id === id);
	if (!spec) return Promise.reject(/* @__PURE__ */ new Error("Missing demo"));
	let pending = cache.get(id);
	if (!pending) {
		pending = render(spec);
		cache.set(id, pending);
	}
	return pending;
}
var FREQ_BIN = /* @__PURE__ */ new Uint8Array(512);
var WAVE_BIN = /* @__PURE__ */ new Uint8Array(1024);
var Engine = class {
	ctx = null;
	preamp = null;
	filters = [];
	volume = null;
	panner = null;
	analyser = null;
	media = null;
	mediaNode = null;
	buffer = null;
	source = null;
	mode = "idle";
	playing = false;
	offset = 0;
	startedAt = 0;
	suppressEnd = false;
	timer = 0;
	pendingVol = .8;
	pendingPan = 0;
	pendingEq = {
		on: true,
		pre: 0,
		bands: [
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0,
			0
		]
	};
	listeners = /* @__PURE__ */ new Set();
	onEnded = null;
	subscribe(listener) {
		this.listeners.add(listener);
		listener(this.snap());
		return () => this.listeners.delete(listener);
	}
	snap() {
		return {
			playing: this.playing,
			position: this.position(),
			duration: this.duration()
		};
	}
	emit() {
		const snap = this.snap();
		for (const listener of this.listeners) listener(snap);
	}
	unlock() {
		return this.ensure().resume();
	}
	ensure() {
		if (this.ctx) return this.ctx;
		const ctx = new AudioContext();
		const preamp = ctx.createGain();
		const volume = ctx.createGain();
		const panner = ctx.createStereoPanner();
		const analyser = ctx.createAnalyser();
		analyser.fftSize = 1024;
		analyser.smoothingTimeConstant = .72;
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
		let node = preamp;
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
	chainInput() {
		if (!this.preamp) throw new Error("Audio is not ready");
		return this.preamp;
	}
	applyEq() {
		if (!this.preamp) return;
		this.preamp.gain.value = this.pendingEq.on ? dbToGain(this.pendingEq.pre) : 1;
		this.filters.forEach((filter, index) => {
			filter.gain.value = this.pendingEq.on ? this.pendingEq.bands[index] ?? 0 : 0;
		});
	}
	setEq(on, preDb, bands) {
		this.pendingEq = {
			on,
			pre: preDb,
			bands: bands.slice(0, 10)
		};
		this.applyEq();
	}
	setVolume(value) {
		this.pendingVol = value;
		if (this.volume) this.volume.gain.value = value;
	}
	setBalance(value) {
		this.pendingPan = value;
		if (this.panner) this.panner.pan.value = value;
	}
	isPlaying() {
		return this.playing;
	}
	hasTrack() {
		return this.mode !== "idle";
	}
	position() {
		if (this.mode === "media" && this.media) return this.media.currentTime || 0;
		if (this.mode === "buffer" && this.playing && this.ctx) return Math.min(this.duration(), this.ctx.currentTime - this.startedAt);
		return this.offset;
	}
	duration() {
		if (this.mode === "media" && this.media && Number.isFinite(this.media.duration)) return this.media.duration;
		if (this.buffer) return this.buffer.duration;
		return 0;
	}
	getDuration() {
		return this.duration();
	}
	startClock() {
		if (this.timer) return;
		this.timer = window.setInterval(() => this.emit(), 200);
	}
	stopClock() {
		if (!this.timer) return;
		window.clearInterval(this.timer);
		this.timer = 0;
	}
	haltBuffer() {
		if (!this.source) return;
		this.suppressEnd = true;
		try {
			this.source.stop();
		} catch {}
		this.source.disconnect();
		this.source = null;
		this.suppressEnd = false;
	}
	startBuffer(offset) {
		if (!this.ctx || !this.buffer) return;
		this.haltBuffer();
		const source = this.ctx.createBufferSource();
		source.buffer = this.buffer;
		source.connect(this.chainInput());
		const clamped = Math.min(Math.max(0, offset), Math.max(0, this.buffer.duration - .05));
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
	async playBuffer(buffer) {
		await this.ensure().resume();
		if (this.media) this.media.pause();
		this.buffer = buffer;
		this.mode = "buffer";
		this.offset = 0;
		this.startBuffer(0);
	}
	async playUrl(url) {
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
			const restartAt = this.offset >= this.buffer.duration - .05 ? 0 : this.offset;
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
	seek(seconds) {
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
	freq() {
		if (!this.analyser) return FREQ_BIN;
		this.analyser.getByteFrequencyData(FREQ_BIN.subarray(0, this.analyser.frequencyBinCount));
		return FREQ_BIN;
	}
	wave() {
		if (!this.analyser) return WAVE_BIN;
		this.analyser.getByteTimeDomainData(WAVE_BIN);
		return WAVE_BIN;
	}
};
var engine = new Engine();
var STOCK_BANDS = PRESETS.Flat ?? [
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0
];
function stockTracks() {
	return DEMOS.map((demo) => ({
		id: demo.id,
		artist: demo.artist,
		title: demo.title,
		duration: demoDuration(demo),
		kind: "demo",
		demoId: demo.id
	}));
}
var ready = false;
var token = 0;
var sleepTimer = 0;
function snapshot(state) {
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
		vis: state.vis
	};
}
function persist(state) {
	if (!ready || typeof window === "undefined") return;
	localStorage.setItem("wimampgtm", JSON.stringify(snapshot(state)));
}
function pushEq(eqOn, bands) {
	engine.setEq(eqOn, bands[0] ?? 0, bands.slice(1));
}
var usePlayer = create((set, get) => ({
	tracks: stockTracks(),
	current: null,
	selected: DEMOS[0]?.id ?? null,
	playing: false,
	position: 0,
	duration: DEMOS[0] ? demoDuration(DEMOS[0]) : 0,
	loading: false,
	error: null,
	volume: .8,
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
			const saved = JSON.parse(raw);
			const bands = Array.isArray(saved.bands) && saved.bands.length === 11 ? saved.bands.map(Number) : get().bands;
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
				vis: saved.vis === "scope" || saved.vis === "off" ? saved.vis : "spectrum"
			});
			engine.setVolume(volume);
			engine.setBalance(balance);
			pushEq(saved.eqOn !== false, bands);
		} catch {}
	},
	pressPlay: () => {
		const { tracks, selected, current } = get();
		const id = selected || current || tracks[0]?.id;
		if (!id) return;
		if (id === current && engine.hasTrack() && !engine.isPlaying()) {
			engine.unlock();
			engine.resume();
			return;
		}
		const index = tracks.findIndex((track) => track.id === id);
		if (index >= 0) get().playAt(index);
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
		set({
			current: track.id,
			selected: track.id,
			error: null,
			loading: true,
			duration: track.duration
		});
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
			set({
				loading: false,
				duration: engine.getDuration() || track.duration
			});
		} catch (error) {
			if (mine !== token) return;
			set({
				loading: false,
				error: error instanceof Error ? error.message : "Playback failed"
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
			get().playAt(0);
			return;
		}
		let next = index;
		if (shuffle) do
			next = Math.floor(Math.random() * tracks.length);
		while (next === index);
		else {
			next = index + 1;
			if (next >= tracks.length) {
				if (fromEnd && repeat === "off") {
					engine.stop();
					return;
				}
				next = 0;
			}
		}
		get().playAt(next);
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
		get().playAt(prev);
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
		set({
			bands,
			preset: "Manual"
		});
		pushEq(get().eqOn, bands);
		persist(get());
	},
	applyPreset: (name) => {
		const curve = PRESETS[name];
		if (!curve) return;
		const bands = [...curve];
		set({
			bands,
			preset: name,
			eqOn: true
		});
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
		if (get().preset === "Auto") {
			const bands = [...STOCK_BANDS];
			set({
				bands,
				preset: "Flat"
			});
			pushEq(get().eqOn, bands);
		} else {
			const bands = [...AUTO_CURVE];
			set({
				bands,
				preset: "Auto",
				eqOn: true
			});
			pushEq(true, bands);
		}
		persist(get());
	},
	toggleShuffle: () => {
		set({ shuffle: !get().shuffle });
		persist(get());
	},
	cycleRepeat: () => {
		const order = [
			"off",
			"all",
			"one"
		];
		set({ repeat: order[(order.indexOf(get().repeat) + 1) % order.length] ?? "off" });
		persist(get());
	},
	cycleVis: () => {
		const order = [
			"spectrum",
			"scope",
			"off"
		];
		set({ vis: order[(order.indexOf(get().vis) + 1) % order.length] ?? "spectrum" });
		persist(get());
	},
	toggleEqWin: () => {
		set({
			showEq: !get().showEq,
			shadeEq: false
		});
		persist(get());
	},
	togglePlWin: () => {
		set({
			showPl: !get().showPl,
			shadePl: false
		});
		persist(get());
	},
	toggleShade: (which) => {
		if (which === "main") set({ shadeMain: !get().shadeMain });
		if (which === "eq") set({ shadeEq: !get().shadeEq });
		if (which === "pl") set({ shadePl: !get().shadePl });
	},
	retire: () => set({ retired: true }),
	restore: () => set({
		retired: false,
		shadeMain: false
	}),
	select: (id) => set({ selected: id }),
	addFiles: async (list) => {
		const files = [...list].filter((file) => file.type.startsWith("audio/") || /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(file.name));
		const added = [];
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
				fileName: file.name
			});
		}
		if (added.length === 0) return;
		set({
			tracks: [...get().tracks, ...added],
			selected: added[0]?.id ?? get().selected
		});
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
			current: current === selected ? null : current
		});
	},
	selectAll: () => {
		const last = get().tracks[get().tracks.length - 1];
		if (last) set({ selected: last.id });
	},
	selectNone: () => set({ selected: null }),
	sortByTitle: () => {
		set({ tracks: [...get().tracks].sort((a, b) => `${a.artist} ${a.title}`.localeCompare(`${b.artist} ${b.title}`)) });
	},
	restoreDemos: () => {
		const have = new Set(get().tracks.map((track) => track.id));
		const missing = stockTracks().filter((track) => !have.has(track.id));
		set({ tracks: [...get().tracks, ...missing] });
	},
	clearPlaylist: () => {
		token += 1;
		engine.stop();
		for (const track of get().tracks) if (track.url) URL.revokeObjectURL(track.url);
		set({
			tracks: [],
			current: null,
			selected: null,
			playing: false,
			position: 0
		});
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
			} else set({ sleepLeft: left });
		}, 1e3);
	}
}));
function probe(url) {
	return new Promise((resolve) => {
		const audio = new Audio();
		audio.preload = "metadata";
		audio.src = url;
		audio.onloadedmetadata = () => resolve(Number.isFinite(audio.duration) ? audio.duration : 0);
		audio.onerror = () => resolve(0);
	});
}
function bindEngine() {
	engine.onEnded = () => {
		const state = usePlayer.getState();
		if (state.repeat === "one") {
			engine.seek(0);
			engine.resume();
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
			duration: snap.duration || state.duration
		});
	});
}
function Fader({ label, value, onChange }) {
	const hit = (0, import_react.useRef)(null);
	const pct = (value + 12) / 24 * 100;
	function fromPointer(clientY) {
		const el = hit.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const t = 1 - (clientY - rect.top) / rect.height;
		onChange(Math.round((-12 + Math.min(1, Math.max(0, t)) * 24) * 2) / 2);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fader",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: hit,
			className: "fader-hit",
			role: "slider",
			tabIndex: 0,
			"aria-valuemin": -12,
			"aria-valuemax": 12,
			"aria-valuenow": value,
			"aria-label": label,
			onPointerDown: (event) => {
				event.currentTarget.setPointerCapture(event.pointerId);
				fromPointer(event.clientY);
			},
			onPointerMove: (event) => {
				if (event.currentTarget.hasPointerCapture(event.pointerId)) fromPointer(event.clientY);
			},
			onKeyDown: (event) => {
				if (event.key === "ArrowUp") onChange(Math.min(12, value + 1));
				if (event.key === "ArrowDown") onChange(Math.max(-12, value - 1));
			},
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "fader-groove" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fader-thumb",
				style: { bottom: `calc(${pct}% - 5px)` }
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "fader-label",
			children: label
		})]
	});
}
function EqWindow() {
	const showEq = usePlayer((s) => s.showEq);
	const shadeEq = usePlayer((s) => s.shadeEq);
	const eqOn = usePlayer((s) => s.eqOn);
	const preset = usePlayer((s) => s.preset);
	const bands = usePlayer((s) => s.bands);
	const [open, setOpen] = (0, import_react.useState)(false);
	const wrap = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function close(event) {
			if (!wrap.current?.contains(event.target)) setOpen(false);
		}
		window.addEventListener("pointerdown", close);
		return () => window.removeEventListener("pointerdown", close);
	}, [open]);
	if (!showEq) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "skin-win eq-win",
		"aria-label": "Equalizer",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "skin-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "wordmark",
					children: "EQ"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "title-fill",
					children: preset.toUpperCase()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "win-btns",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Shade equalizer",
						onClick: () => usePlayer.getState().toggleShade("eq"),
						children: "_"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Close equalizer",
						onClick: () => usePlayer.getState().toggleEqWin(),
						children: "×"
					})]
				})
			]
		}), !shadeEq && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "skin-body",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "eq-top",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tool-btn${eqOn ? " on" : ""}`,
						"aria-pressed": eqOn,
						onClick: () => usePlayer.getState().toggleEq(),
						children: "ON"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `tool-btn${preset === "Auto" ? " on" : ""}`,
						"aria-pressed": preset === "Auto",
						onClick: () => usePlayer.getState().toggleAuto(),
						children: "AUTO"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "menu-wrap",
						ref: wrap,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "tool-btn",
							"aria-expanded": open,
							onClick: () => setOpen((value) => !value),
							children: preset
						}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "menu",
							role: "menu",
							children: PRESET_NAMES.map((name) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitemradio",
								"aria-checked": preset === name,
								onClick: () => {
									usePlayer.getState().applyPreset(name);
									setOpen(false);
								},
								children: name
							}, name))
						})]
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fader-row",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "scale",
						"aria-hidden": "true",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "+12" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "0" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "-12" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fader, {
						label: "PRE",
						value: bands[0] ?? 0,
						onChange: (value) => usePlayer.getState().setBand(0, value)
					}),
					FREQ_LABELS.map((label, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fader, {
						label,
						value: bands[index + 1] ?? 0,
						onChange: (value) => usePlayer.getState().setBand(index + 1, value)
					}, label))
				]
			})]
		})]
	});
}
var BARS = 24;
function Visor({ mode, playing, onCycle }) {
	const barsRef = (0, import_react.useRef)(null);
	const scopeRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
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
				for (const child of bars.children) child.style.height = "2px";
				scope.setAttribute("points", "0,50 100,50");
				return;
			}
			if (mode === "scope") {
				const wave = engine.wave();
				const step = Math.max(1, Math.floor(wave.length / 64));
				let points = "";
				let x = 0;
				for (let i = 0; i < wave.length; i += step) {
					const y = (wave[i] ?? 128) / 255 * 100;
					points += `${x.toFixed(1)},${y.toFixed(1)} `;
					x += 100 / (wave.length / step);
				}
				scope.setAttribute("points", points);
				return;
			}
			const bins = engine.freq();
			for (let i = 0; i < BARS; i++) {
				const start = Math.floor(i / BARS * 70);
				const end = Math.floor((i + 1) / BARS * 70);
				let peak = 0;
				for (let b = start; b <= end; b++) peak = Math.max(peak, bins[b] ?? 0);
				const level = peak / 255;
				peaks[i] = Math.max(level, (peaks[i] ?? 0) * .9);
				const child = bars.children[i];
				if (child) child.style.height = `${Math.max(2, peaks[i] * 100)}%`;
			}
		};
		tick();
		return () => window.cancelAnimationFrame(frame);
	}, [mode, playing]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "visor",
		role: "button",
		tabIndex: 0,
		"aria-label": `Visualization ${mode}. Activate to change.`,
		onClick: onCycle,
		onKeyDown: (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				onCycle();
			}
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bars",
			ref: barsRef,
			children: Array.from({ length: BARS }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {}, index))
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
			className: "scope",
			viewBox: "0 0 100 100",
			preserveAspectRatio: "none",
			"aria-hidden": "true",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polyline", {
				ref: scopeRef,
				points: "0,50 100,50",
				style: { display: "none" }
			})
		})]
	});
}
function fmt(sec) {
	if (!Number.isFinite(sec) || sec < 0) sec = 0;
	const s = Math.floor(sec % 60);
	return `${Math.floor(sec / 60)}:${s.toString().padStart(2, "0")}`;
}
function MainWindow({ onOpen }) {
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
	const ticker = error ? error : loading ? "Loading…" : track ? `${track.artist}  -  ${track.title}   ${index + 1}/${tracks.length}` : "WIMAMP GTM  -  stock skin  -  press play";
	if (retired) return null;
	const pct = duration > 0 ? Math.min(100, position / duration * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "skin-win main-win",
		"aria-label": "Main player",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "skin-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "wordmark",
					children: "WIMAMP"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "gtm-chip",
					children: "GTM"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "title-fill",
					children: shadeMain ? ticker : "STOCK"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "win-btns",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Shade main window",
						onClick: () => usePlayer.getState().toggleShade("main"),
						children: "_"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Minimize player",
						onClick: () => usePlayer.getState().retire(),
						children: "×"
					})]
				})
			]
		}), !shadeMain && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "skin-body",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lcd-row",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "clutter",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "mini-btn",
								"aria-label": "Open audio files",
								onClick: onOpen,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderOpen, { size: 14 })
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "ticker-well",
							"aria-live": "polite",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: playing ? "ticker-track" : void 0,
								children: ticker
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "digits-well",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "digits",
								children: fmt(position)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "digits-sub",
								children: sleepLeft != null ? `Z ${fmt(sleepLeft)}` : fmt(duration)
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "main-stage",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Visor, {
						mode: vis,
						playing,
						onCycle: () => usePlayer.getState().cycleVis()
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "readout",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "STEREO" }) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: track?.kind === "file" ? "FILE" : "SYNTH" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "44 KHZ" })
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "seek",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "slider-line",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SEEK" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "skin-range",
							type: "range",
							min: 0,
							max: duration || 0,
							step: .1,
							value: Math.min(position, duration || 0),
							"aria-label": "Seek",
							style: { ["--pct"]: `${pct}%` },
							onPointerDown: () => usePlayer.getState().setScrubbing(true),
							onPointerUp: (event) => {
								usePlayer.getState().setScrubbing(false);
								usePlayer.getState().seek(Number(event.currentTarget.value));
							},
							onChange: (event) => {
								const value = Number(event.target.value);
								if (usePlayer.getState().scrubbing) usePlayer.setState({ position: value });
								else usePlayer.getState().seek(value);
							}
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "transport",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "t-btn",
							"aria-label": "Previous",
							onClick: () => usePlayer.getState().prev(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipBack, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `t-btn${playing ? " on" : ""}`,
							"aria-label": "Play",
							onClick: () => usePlayer.getState().pressPlay(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "t-btn",
							"aria-label": "Pause",
							onClick: () => usePlayer.getState().pause(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "t-btn",
							"aria-label": "Stop",
							onClick: () => usePlayer.getState().stop(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "t-btn",
							"aria-label": "Next",
							onClick: () => usePlayer.getState().next(false),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkipForward, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "slider-stack",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "slider-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "VOL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "skin-range",
									type: "range",
									min: 0,
									max: 1,
									step: .01,
									value: volume,
									"aria-label": "Volume",
									style: { ["--pct"]: `${volume * 100}%` },
									onChange: (event) => usePlayer.getState().setVolume(Number(event.target.value))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "slider-line",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BAL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "skin-range",
									type: "range",
									min: -1,
									max: 1,
									step: .01,
									value: balance,
									"aria-label": "Balance",
									style: { ["--pct"]: `${(balance + 1) / 2 * 100}%` },
									onChange: (event) => usePlayer.getState().setBalance(Number(event.target.value))
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: `t-btn${shuffle ? " on" : ""}`,
							"aria-pressed": shuffle,
							"aria-label": "Shuffle",
							onClick: () => usePlayer.getState().toggleShuffle(),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shuffle, {})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: `t-btn${repeat !== "off" ? " on" : ""}`,
							"aria-pressed": repeat !== "off",
							"aria-label": `Repeat ${repeat}`,
							onClick: () => usePlayer.getState().cycleRepeat(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Repeat, {}), repeat === "one" ? "1" : ""]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "side-toggles",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `tool-btn${showEq ? " on" : ""}`,
								"aria-pressed": showEq,
								onClick: () => usePlayer.getState().toggleEqWin(),
								children: "EQ"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: `tool-btn${showPl ? " on" : ""}`,
								"aria-pressed": showPl,
								onClick: () => usePlayer.getState().togglePlWin(),
								children: "PL"
							})]
						})
					]
				})
			]
		})]
	});
}
function Menu({ label, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const wrap = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open) return;
		function close(event) {
			if (!wrap.current?.contains(event.target)) setOpen(false);
		}
		window.addEventListener("pointerdown", close);
		return () => window.removeEventListener("pointerdown", close);
	}, [open]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "menu-wrap",
		ref: wrap,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "tool-btn",
			"aria-expanded": open,
			onClick: () => setOpen((value) => !value),
			children: label
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "menu",
			role: "menu",
			children: children(() => setOpen(false))
		})]
	});
}
function PlaylistWindow({ onOpen }) {
	const showPl = usePlayer((s) => s.showPl);
	const shadePl = usePlayer((s) => s.shadePl);
	const tracks = usePlayer((s) => s.tracks);
	const current = usePlayer((s) => s.current);
	const selected = usePlayer((s) => s.selected);
	const total = tracks.reduce((sum, track) => sum + (track.duration || 0), 0);
	if (!showPl) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "skin-win pl-win",
		"aria-label": "Playlist",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "skin-title",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "wordmark",
					children: "PL"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "title-fill",
					children: "PLAYLIST"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "win-btns",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Shade playlist",
						onClick: () => usePlayer.getState().toggleShade("pl"),
						children: "_"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Close playlist",
						onClick: () => usePlayer.getState().togglePlWin(),
						children: "×"
					})]
				})
			]
		}), !shadePl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "skin-body",
			children: [
				tracks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "empty-list",
					children: "Empty. ADD a file, or LIST → restore demos."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "list",
					children: tracks.map((track, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: `row${track.id === current ? " now" : ""}${track.id === selected && track.id !== current ? " sel" : ""}`,
						onClick: () => {
							if (usePlayer.getState().selected === track.id) usePlayer.getState().playAt(index);
							else usePlayer.getState().select(track.id);
						},
						onDoubleClick: () => void usePlayer.getState().playAt(index),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: String(index + 1).padStart(2, "0") }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
								track.artist,
								" — ",
								track.title,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: track.kind === "file" ? "local file" : "stock demo" })
							] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "when",
								children: fmt(track.duration)
							})
						]
					}) }, track.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "plist-foot",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						tracks.length,
						" tracks · ",
						fmt(total)
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "plist-tools",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "tool-btn",
							onClick: onOpen,
							children: "ADD"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "tool-btn",
							onClick: () => usePlayer.getState().removeSelected(),
							children: "REM"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
							label: "SEL",
							children: (close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									const id = usePlayer.getState().current;
									if (id) usePlayer.getState().select(id);
									close();
								},
								children: "Playing"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									usePlayer.getState().selectNone();
									close();
								},
								children: "None"
							})] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
							label: "MISC",
							children: (close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "menuitem",
									onClick: () => {
										usePlayer.getState().sortByTitle();
										close();
									},
									children: "Sort by title"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "menuitem",
									onClick: () => {
										usePlayer.getState().armSleep(15);
										close();
									},
									children: "Sleep 15 min"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "menuitem",
									onClick: () => {
										usePlayer.getState().armSleep(30);
										close();
									},
									children: "Sleep 30 min"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "menuitem",
									onClick: () => {
										usePlayer.getState().armSleep(null);
										close();
									},
									children: "Sleep off"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									role: "menuitem",
									onClick: () => {
										usePlayer.getState().exportM3u();
										close();
									},
									children: "Export m3u"
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
							label: "LIST",
							children: (close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									usePlayer.getState().restoreDemos();
									close();
								},
								children: "Restore demos"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								role: "menuitem",
								onClick: () => {
									usePlayer.getState().clearPlaylist();
									close();
								},
								children: "Clear list"
							})] })
						})
					]
				})
			]
		})]
	});
}
function Player() {
	const fileRef = (0, import_react.useRef)(null);
	const retired = usePlayer((s) => s.retired);
	const showPl = usePlayer((s) => s.showPl);
	const playing = usePlayer((s) => s.playing);
	const position = usePlayer((s) => s.position);
	const current = usePlayer((s) => s.current);
	const track = usePlayer((s) => s.tracks).find((item) => item.id === current);
	(0, import_react.useEffect)(() => {
		usePlayer.getState().hydrate();
		return bindEngine();
	}, []);
	(0, import_react.useEffect)(() => {
		const previous = document.title;
		document.title = track ? `${track.artist} — ${track.title} · Wimampgtm` : "Wimampgtm";
		return () => {
			document.title = previous;
		};
	}, [track]);
	(0, import_react.useEffect)(() => {
		function onKey(event) {
			const target = event.target;
			if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.getAttribute("role") === "slider")) return;
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
			else if (key === "ArrowUp") state.setVolume(Math.min(1, state.volume + .05));
			else if (key === "ArrowDown") state.setVolume(Math.max(0, state.volume - .05));
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: showPl && !retired ? "desk split" : "desk",
		onDragOver: (event) => event.preventDefault(),
		onDrop: (event) => {
			event.preventDefault();
			if (event.dataTransfer.files.length) usePlayer.getState().addFiles(event.dataTransfer.files);
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				ref: fileRef,
				type: "file",
				accept: "audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac",
				multiple: true,
				hidden: true,
				onChange: (event) => {
					if (event.target.files) usePlayer.getState().addFiles(event.target.files);
					event.target.value = "";
				}
			}),
			retired ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "dock-pill",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "win-btn",
						"aria-label": "Restore player",
						onClick: () => usePlayer.getState().restore(),
						children: "+"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "wordmark",
						children: "WIMAMP"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "gtm-chip",
						children: "GTM"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "digits",
						children: fmt(position)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: `t-btn${playing ? " on" : ""}`,
						"aria-label": playing ? "Pause" : "Play",
						onClick: () => usePlayer.getState().toggle(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, {})
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MainWindow, { onOpen: openFiles }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EqWindow, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PlaylistWindow, { onOpen: openFiles })
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "desk-hint",
				children: [
					"Space plays. Z X C V B are the old transport keys. Click the visor. Drop audio to add it.",
					" ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/rust",
						children: "Rust version"
					})
				]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Player, {});
}
//#endregion
export { Home as component };
