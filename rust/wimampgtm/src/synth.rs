pub struct Demo {
    pub artist: &'static str,
    pub title: &'static str,
    pub bpm: f64,
    pub bars: u32,
    pub root: i32,
    pub vibe: u8,
}

pub const DEMOS: [Demo; 8] = [
    Demo { artist: "Ana Voss", title: "Midnight Circuit", bpm: 98.0, bars: 8, root: 45, vibe: 0 },
    Demo { artist: "Harbor Line", title: "Teardrop Delay", bpm: 84.0, bars: 8, root: 40, vibe: 1 },
    Demo { artist: "North Pier", title: "Glass Box", bpm: 112.0, bars: 8, root: 52, vibe: 2 },
    Demo { artist: "Kite Audio", title: "Silver Room", bpm: 90.0, bars: 8, root: 48, vibe: 3 },
    Demo { artist: "Silt", title: "Low Tide", bpm: 76.0, bars: 8, root: 36, vibe: 1 },
    Demo { artist: "Field Notes", title: "Eple Tape", bpm: 104.0, bars: 8, root: 55, vibe: 4 },
    Demo { artist: "Soft Circuit", title: "Destiny Lane", bpm: 94.0, bars: 8, root: 43, vibe: 3 },
    Demo { artist: "Night Ledger", title: "Blonde Static", bpm: 120.0, bars: 8, root: 50, vibe: 5 },
];

pub fn duration(demo: &Demo) -> f64 {
    demo.bars as f64 * 4.0 * 60.0 / demo.bpm
}

fn midi(note: i32) -> f64 {
    440.0 * 2f64.powf((note - 69) as f64 / 12.0)
}

fn add_tone(buf: &mut [f32], sr: u32, start: f64, dur: f64, freq: f64, amp: f32, sweep: f64) {
    if dur <= 0.0 || freq <= 0.0 {
        return;
    }
    let s0 = (start * sr as f64) as usize;
    let n = (dur * sr as f64) as usize;
    let mut phase = 0.0;
    for i in 0..n {
        let idx = s0 + i;
        if idx >= buf.len() {
            break;
        }
        let p = i as f64 / n as f64;
        let f = freq * (1.0 - sweep * p);
        phase += f / sr as f64;
        let env = (1.0 - p).powi(2) as f32;
        buf[idx] += (phase * std::f64::consts::TAU).sin() as f32 * amp * env;
    }
}

fn add_noise(buf: &mut [f32], sr: u32, start: f64, dur: f64, amp: f32, seed: u32) {
    let s0 = (start * sr as f64) as usize;
    let n = (dur * sr as f64) as usize;
    for i in 0..n {
        let idx = s0 + i;
        if idx >= buf.len() {
            break;
        }
        let p = i as f64 / n.max(1) as f64;
        let mut z = seed.wrapping_add(i as u32).wrapping_mul(747796405);
        z = (z >> 16) ^ z;
        let noise = (z as f32 / u32::MAX as f32) * 2.0 - 1.0;
        let env = (1.0 - p).powi(3) as f32;
        buf[idx] += noise * amp * env;
    }
}

pub fn render(demo: &Demo, sr: u32) -> (Vec<f32>, Vec<f32>) {
    let seconds = duration(demo);
    let n = (seconds * sr as f64) as usize;
    let mut left = vec![0.0f32; n];
    let beat = 60.0 / demo.bpm;
    let beats = demo.bars * 4;
    for b in 0..beats {
        let t = b as f64 * beat;
        if demo.vibe != 4 {
            add_tone(&mut left, sr, t, 0.22, 150.0, 0.62, 0.72);
        }
        if b % 2 == 1 {
            add_noise(&mut left, sr, t, 0.04, if demo.vibe == 2 { 0.16 } else { 0.09 }, 1000 + b);
        }
        if b % 4 == 2 && demo.vibe != 4 {
            add_noise(&mut left, sr, t, 0.14, 0.22, 9000 + b);
        }
        if b % 2 == 0 {
            let degree = [0, 0, 7, 3, 5, 0, 10, 7][(b as usize / 2) % 8];
            let wave = if demo.vibe == 5 { 0.28 } else { 0.2 };
            add_tone(&mut left, sr, t, beat * 1.3, midi(demo.root + degree), wave, 0.02);
        }
        if demo.vibe == 4 || demo.vibe == 3 {
            if b % 4 == 0 {
                for interval in [0, 3, 7] {
                    add_tone(&mut left, sr, t, beat * 3.0, midi(demo.root + 12 + interval), 0.09, 0.0);
                }
            }
        } else {
            let arp = [0, 3, 7, 12, 7, 3, 10, 12][b as usize % 8];
            add_tone(
                &mut left,
                sr,
                t,
                beat * 0.55,
                midi(demo.root + 12 + arp),
                if demo.vibe == 5 { 0.12 } else { 0.07 },
                0.0,
            );
        }
    }
    for sample in &mut left {
        *sample = (*sample as f64).tanh() as f32 * 0.9;
    }
    let mut right = left.clone();
    let delay = ((0.007 * sr as f64) as usize).min(n.saturating_sub(1));
    for i in (delay..n).rev() {
        right[i] = right[i - delay] * 0.72 + left[i] * 0.28;
    }
    (left, right)
}
