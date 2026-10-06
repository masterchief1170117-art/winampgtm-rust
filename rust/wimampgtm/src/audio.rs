use wasm_bindgen::{JsCast, JsValue, closure::Closure};
use web_sys::{
    AnalyserNode, AudioBuffer, AudioBufferSourceNode, AudioContext, BiquadFilterNode,
    BiquadFilterType, GainNode, StereoPannerNode,
};

const FREQS: [f32; 10] = [60.0, 170.0, 310.0, 600.0, 1000.0, 3000.0, 6000.0, 12000.0, 14000.0, 16000.0];

fn db_to_gain(db: f32) -> f32 {
    10f32.powf(db / 20.0)
}

pub struct Engine {
    ctx: AudioContext,
    preamp: GainNode,
    filters: Vec<BiquadFilterNode>,
    volume: GainNode,
    panner: StereoPannerNode,
    analyser: AnalyserNode,
    source: Option<AudioBufferSourceNode>,
    buffer: Option<AudioBuffer>,
    started_at: f64,
    offset: f64,
    duration: f64,
    pub playing: bool,
    on_end: Option<Closure<dyn FnMut()>>,
}

impl Engine {
    pub fn new() -> Result<Self, JsValue> {
        let ctx = AudioContext::new()?;
        let preamp = ctx.create_gain()?;
        let volume = ctx.create_gain()?;
        volume.gain().set_value(0.8);
        let panner = ctx.create_stereo_panner()?;
        let analyser = ctx.create_analyser()?;
        analyser.set_fft_size(1024);
        analyser.set_smoothing_time_constant(0.72);
        let mut filters = Vec::with_capacity(10);
        let mut node = preamp.clone().dyn_into::<web_sys::AudioNode>()?;
        for freq in FREQS {
            let filter = ctx.create_biquad_filter()?;
            filter.set_type(BiquadFilterType::Peaking);
            filter.frequency().set_value(freq);
            filter.q().set_value(1.15);
            filter.gain().set_value(0.0);
            node.connect_with_audio_node(&filter)?;
            node = filter.clone().dyn_into()?;
            filters.push(filter);
        }
        node.connect_with_audio_node(&volume)?;
        volume.connect_with_audio_node(&panner)?;
        panner.connect_with_audio_node(&analyser)?;
        analyser.connect_with_audio_node(&ctx.destination())?;
        Ok(Self {
            ctx,
            preamp,
            filters,
            volume,
            panner,
            analyser,
            source: None,
            buffer: None,
            started_at: 0.0,
            offset: 0.0,
            duration: 0.0,
            playing: false,
            on_end: None,
        })
    }

    pub fn sample_rate(&self) -> u32 {
        self.ctx.sample_rate() as u32
    }

    pub fn context(&self) -> &AudioContext {
        &self.ctx
    }

    pub fn set_volume(&self, value: f32) {
        self.volume.gain().set_value(value);
    }

    pub fn set_balance(&self, value: f32) {
        self.panner.pan().set_value(value);
    }

    pub fn set_eq(&self, on: bool, bands: &[f32; 11]) {
        self.preamp.gain().set_value(if on { db_to_gain(bands[0]) } else { 1.0 });
        for (filter, gain) in self.filters.iter().zip(bands.iter().skip(1)) {
            filter.gain().set_value(if on { *gain } else { 0.0 });
        }
    }

    pub fn position(&self) -> f64 {
        if self.playing {
            (self.ctx.current_time() - self.started_at).clamp(0.0, self.duration)
        } else {
            self.offset
        }
    }

    pub fn duration(&self) -> f64 {
        self.duration
    }

    fn halt(&mut self) {
        if let Some(src) = self.source.take() {
            src.set_onended(None);
            let _ = src.stop();
            let _ = src.disconnect();
        }
        self.on_end = None;
        self.playing = false;
    }

    pub fn play_buffer(&mut self, buffer: AudioBuffer, ended: Closure<dyn FnMut()>) -> Result<(), JsValue> {
        let _ = self.ctx.resume();
        self.halt();
        let src = self.ctx.create_buffer_source()?;
        src.set_buffer(Some(&buffer));
        src.connect_with_audio_node(&self.preamp)?;
        src.set_onended(Some(ended.as_ref().unchecked_ref()));
        src.start_with_when_and_grain_offset(0.0, 0.0)?;
        self.duration = buffer.duration();
        self.buffer = Some(buffer);
        self.started_at = self.ctx.current_time();
        self.offset = 0.0;
        self.playing = true;
        self.source = Some(src);
        self.on_end = Some(ended);
        Ok(())
    }

    pub fn pause(&mut self) {
        if !self.playing {
            return;
        }
        self.offset = self.position();
        self.halt();
    }

    pub fn resume(&mut self, ended: Closure<dyn FnMut()>) -> Result<(), JsValue> {
        if self.playing {
            return Ok(());
        }
        let Some(buffer) = self.buffer.clone() else {
            return Ok(());
        };
        let _ = self.ctx.resume();
        let offset = if self.offset >= self.duration - 0.05 { 0.0 } else { self.offset };
        let src = self.ctx.create_buffer_source()?;
        src.set_buffer(Some(&buffer));
        src.connect_with_audio_node(&self.preamp)?;
        src.set_onended(Some(ended.as_ref().unchecked_ref()));
        src.start_with_when_and_grain_offset(0.0, offset)?;
        self.started_at = self.ctx.current_time() - offset;
        self.offset = offset;
        self.playing = true;
        self.source = Some(src);
        self.on_end = Some(ended);
        Ok(())
    }

    pub fn stop(&mut self) {
        self.halt();
        self.offset = 0.0;
    }

    pub fn seek(&mut self, seconds: f64, ended: Option<Closure<dyn FnMut()>>) -> Result<(), JsValue> {
        let next = seconds.clamp(0.0, self.duration);
        self.offset = next;
        if self.playing {
            if let Some(ended) = ended {
                let buffer = self.buffer.clone();
                self.halt();
                if let Some(buffer) = buffer {
                    let src = self.ctx.create_buffer_source()?;
                    src.set_buffer(Some(&buffer));
                    src.connect_with_audio_node(&self.preamp)?;
                    src.set_onended(Some(ended.as_ref().unchecked_ref()));
                    src.start_with_when_and_grain_offset(0.0, next)?;
                    self.started_at = self.ctx.current_time() - next;
                    self.playing = true;
                    self.source = Some(src);
                    self.on_end = Some(ended);
                    self.buffer = Some(buffer);
                }
            }
        }
        Ok(())
    }

    pub fn has_buffer(&self) -> bool {
        self.buffer.is_some()
    }

    pub fn note_ended(&mut self) {
        self.playing = false;
        self.offset = self.duration;
    }

    pub fn bins(&self, out: &mut [u8]) {
        self.analyser.get_byte_frequency_data(out);
    }
}
