use std::cell::{Cell, RefCell};

use js_sys::ArrayBuffer;
use wasm_bindgen::{JsCast, closure::Closure};
use wasm_bindgen_futures::JsFuture;
use web_sys::{
    AudioBuffer, Document, Event, FileList, HtmlElement, HtmlInputElement, HtmlSelectElement,
    KeyboardEvent, PointerEvent, window,
};

use crate::audio::Engine;
use crate::synth::{self, DEMOS};

const LABELS: [&str; 11] = ["PRE", "60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"];
const PRESETS: [(&str, [f32; 11]); 10] = [
    ("Flat", [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    ("Rock", [0.0, 5.0, 3.0, -1.0, -2.0, -1.0, 2.0, 4.0, 5.0, 5.0, 5.0]),
    ("Dance", [0.0, 6.0, 4.0, 1.0, 0.0, -1.0, -1.0, 0.0, 3.0, 4.0, 4.0]),
    ("Pop", [0.0, -1.0, 2.0, 4.0, 4.0, 2.0, 0.0, -1.0, -1.0, -1.0, -1.0]),
    ("Classical", [0.0, 4.0, 3.0, 2.0, 1.0, -1.0, -1.0, 0.0, 2.0, 3.0, 4.0]),
    ("Bass", [2.0, 7.0, 6.0, 4.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]),
    ("Treble", [0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 3.0, 5.0, 6.0, 7.0, 7.0]),
    ("Vocal", [0.0, -2.0, -1.0, 1.0, 3.0, 4.0, 4.0, 2.0, 0.0, -1.0, -2.0]),
    ("Laptop", [3.0, 4.0, 5.0, 3.0, 0.0, -2.0, -1.0, 1.0, 3.0, 4.0, 3.0]),
    ("Soft", [-2.0, 2.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, 2.0, 2.0, 1.0]),
];

thread_local! {
    static PLAYER: RefCell<Option<Player>> = const { RefCell::new(None) };
    static EPOCH: Cell<u32> = const { Cell::new(0) };
}

fn with(f: impl FnOnce(&mut Player)) {
    PLAYER.with(|slot| {
        if let Some(player) = slot.borrow_mut().as_mut() {
            f(player);
        }
    });
}

fn doc() -> Document {
    window().unwrap().document().unwrap()
}

fn el(tag: &str, class: &str) -> HtmlElement {
    let node = doc().create_element(tag).unwrap();
    node.set_class_name(class);
    node.dyn_into().unwrap()
}

fn on_click(node: &HtmlElement, f: impl FnMut() + 'static) {
    let closure = Closure::wrap(Box::new(f) as Box<dyn FnMut()>);
    node.set_onclick(Some(closure.as_ref().unchecked_ref()));
    closure.forget();
}

enum Kind {
    Demo(usize),
    File(AudioBuffer),
}

struct Track {
    artist: String,
    title: String,
    duration: f64,
    kind: Kind,
}

struct Player {
    root: HtmlElement,
    ticker: HtmlElement,
    digits: HtmlElement,
    sub: HtmlElement,
    bars: Vec<HtmlElement>,
    list: HtmlElement,
    rows: Vec<HtmlElement>,
    foot: HtmlElement,
    seek: HtmlInputElement,
    thumbs: Vec<HtmlElement>,
    eq_btn: HtmlElement,
    pl_btn: HtmlElement,
    eq_win: HtmlElement,
    pl_win: HtmlElement,
    file: HtmlInputElement,
    engine: Option<Engine>,
    tracks: Vec<Track>,
    cache: Vec<Option<AudioBuffer>>,
    current: usize,
    bands: [f32; 11],
    eq_on: bool,
    volume: f32,
    balance: f32,
    shuffle: bool,
    repeat: u8,
    show_eq: bool,
    show_pl: bool,
    scrubbing: bool,
    timer: i32,
    keys: Option<Closure<dyn FnMut(Event)>>,
}

pub fn mount() {
    shutdown();
    let Some(host) = doc().get_element_by_id("wimamp-rust") else {
        return;
    };
    host.set_text_content(Some(""));
    let player = Player::build();
    let root = player.root.clone();
    host.append_child(&root).ok();
    PLAYER.with(|slot| *slot.borrow_mut() = Some(player));
    with(Player::arm);
}

pub fn shutdown() {
    let player = PLAYER.with(|slot| slot.borrow_mut().take());
    if let Some(mut player) = player {
        player.teardown();
    }
}

impl Player {
    fn build() -> Self {
        let root = el("div", "desk split");
        let tracks = demo_tracks();
        let mut player = Self {
            root: root.clone(),
            ticker: el("span", ""),
            digits: el("span", "digits"),
            sub: el("span", "digits-sub"),
            bars: Vec::new(),
            list: el("ul", "list"),
            rows: Vec::new(),
            foot: el("div", "plist-foot"),
            seek: doc().create_element("input").unwrap().dyn_into().unwrap(),
            thumbs: Vec::new(),
            eq_btn: el("button", "tool-btn on"),
            pl_btn: el("button", "tool-btn on"),
            eq_win: el("section", "skin-win eq-win"),
            pl_win: el("section", "skin-win pl-win"),
            file: doc().create_element("input").unwrap().dyn_into().unwrap(),
            engine: None,
            tracks,
            cache: vec![None; DEMOS.len()],
            current: 0,
            bands: [0.0; 11],
            eq_on: true,
            volume: 0.8,
            balance: 0.0,
            shuffle: false,
            repeat: 0,
            show_eq: true,
            show_pl: true,
            scrubbing: false,
            timer: 0,
            keys: None,
        };
        player.layout();
        player.refresh_rows();
        player.paint_text();
        player
    }

    fn layout(&mut self) {
        let main = self.main_window();
        let eq = self.eq_window();
        let playlist = self.pl_window();
        self.root.append_child(&main).ok();
        self.root.append_child(&eq).ok();
        self.root.append_child(&playlist).ok();
        let hint = el("p", "desk-hint");
        hint.set_text_content(Some("Rust / Wasm build. Space plays. Drop audio to add it."));
        let back = el("a", "");
        back.set_attribute("href", "/").ok();
        back.set_text_content(Some(" JS version"));
        hint.append_child(&back).ok();
        self.root.append_child(&hint).ok();
        self.file.set_type("file");
        self.file.set_accept("audio/*");
        self.file.set_multiple(true);
        self.file.style().set_property("display", "none").ok();
        let file = self.file.clone();
        let closure = Closure::wrap(Box::new(move || {
            if let Some(list) = file.files() {
                add_files(list);
            }
            file.set_value("");
        }) as Box<dyn FnMut()>);
        self.file.set_onchange(Some(closure.as_ref().unchecked_ref()));
        closure.forget();
        self.root.append_child(&self.file).ok();
    }

    fn main_window(&mut self) -> HtmlElement {
        let win = el("section", "skin-win main-win");
        win.set_attribute("aria-label", "Main player").ok();
        let title = el("header", "skin-title");
        let mark = el("h1", "wordmark");
        mark.set_text_content(Some("WIMAMP"));
        let chip = el("span", "gtm-chip");
        chip.set_text_content(Some("RUST"));
        let fill = el("span", "title-fill");
        fill.set_text_content(Some("WASM"));
        title.append_child(&mark).ok();
        title.append_child(&chip).ok();
        title.append_child(&fill).ok();
        win.append_child(&title).ok();

        let body = el("div", "skin-body");
        let row = el("div", "lcd-row");
        let well = el("div", "ticker-well");
        self.ticker.set_text_content(Some("RUST  -  press play"));
        well.append_child(&self.ticker).ok();
        let digits = el("div", "digits-well");
        self.digits.set_text_content(Some("0:00"));
        self.sub.set_text_content(Some("0:00"));
        digits.append_child(&self.digits).ok();
        digits.append_child(&self.sub).ok();
        row.append_child(&well).ok();
        row.append_child(&digits).ok();
        body.append_child(&row).ok();

        let stage = el("div", "main-stage");
        let visor = el("div", "visor");
        visor.set_attribute("role", "button").ok();
        visor.set_attribute("aria-label", "Visualization").ok();
        let bars = el("div", "bars");
        for _ in 0..24 {
            let bar = el("span", "");
            bars.append_child(&bar).ok();
            self.bars.push(bar);
        }
        visor.append_child(&bars).ok();
        on_click(&visor, || with(Player::cycle_vis));
        stage.append_child(&visor).ok();
        body.append_child(&stage).ok();

        let readout = el("div", "readout");
        readout.set_text_content(Some("STEREO    RUST    48 KHZ"));
        body.append_child(&readout).ok();

        let seek_row = el("div", "seek");
        let label = el("label", "slider-line");
        let name = el("span", "");
        name.set_text_content(Some("SEEK"));
        self.seek.set_class_name("skin-range");
        self.seek.set_type("range");
        self.seek.set_min("0");
        self.seek.set_max("1");
        self.seek.set_step("0.1");
        self.seek.set_value("0");
        self.seek.set_attribute("aria-label", "Seek").ok();
        let seek = self.seek.clone();
        let down = Closure::wrap(Box::new(move || {
            with(|player| player.scrubbing = true);
        }) as Box<dyn FnMut()>);
        seek.set_onpointerdown(Some(down.as_ref().unchecked_ref()));
        down.forget();
        let seek = self.seek.clone();
        let seek_read = seek.clone();
        let change = Closure::wrap(Box::new(move || {
            let value = seek_read.value_as_number();
            with(|player| {
                player.scrubbing = false;
                player.seek_to(value);
            });
        }) as Box<dyn FnMut()>);
        seek.set_onchange(Some(change.as_ref().unchecked_ref()));
        change.forget();
        label.append_child(&name).ok();
        label.append_child(&self.seek).ok();
        seek_row.append_child(&label).ok();
        body.append_child(&seek_row).ok();

        let transport = el("div", "transport");
        transport.append_child(&self.transport_button("‹‹", "Previous", |player| player.prev())).ok();
        transport.append_child(&self.transport_button("▶", "Play", |player| player.press_play())).ok();
        transport.append_child(&self.transport_button("❚❚", "Pause", |player| player.pause())).ok();
        transport.append_child(&self.transport_button("■", "Stop", |player| player.stop())).ok();
        transport.append_child(&self.transport_button("››", "Next", |player| player.next(false))).ok();
        transport.append_child(&self.sliders()).ok();
        let shuffle = el("button", "t-btn");
        shuffle.set_attribute("aria-label", "Shuffle").ok();
        shuffle.set_text_content(Some("⇄"));
        on_click(&shuffle, || with(Player::toggle_shuffle));
        let repeat = el("button", "t-btn");
        repeat.set_attribute("aria-label", "Repeat").ok();
        repeat.set_text_content(Some("↻"));
        on_click(&repeat, || with(Player::cycle_repeat));
        transport.append_child(&shuffle).ok();
        transport.append_child(&repeat).ok();
        self.eq_btn.set_text_content(Some("EQ"));
        self.pl_btn.set_text_content(Some("PL"));
        on_click(&self.eq_btn, || with(Player::toggle_eq_win));
        on_click(&self.pl_btn, || with(Player::toggle_pl_win));
        let side = el("div", "side-toggles");
        side.append_child(&self.eq_btn).ok();
        side.append_child(&self.pl_btn).ok();
        transport.append_child(&side).ok();
        body.append_child(&transport).ok();
        win.append_child(&body).ok();
        win
    }

    fn transport_button(&self, glyph: &str, label: &str, action: fn(&mut Player)) -> HtmlElement {
        let button = el("button", "t-btn");
        button.set_attribute("aria-label", label).ok();
        button.set_text_content(Some(glyph));
        on_click(&button, move || with(action));
        button
    }

    fn sliders(&mut self) -> HtmlElement {
        let stack = el("div", "slider-stack");
        stack.append_child(&self.range("VOL", "Volume", 0.0, 1.0, 0.01, self.volume, true)).ok();
        stack.append_child(&self.range("BAL", "Balance", -1.0, 1.0, 0.01, self.balance, false)).ok();
        stack
    }

    fn range(&self, name: &str, aria: &str, min: f64, max: f64, step: f64, value: f32, volume: bool) -> HtmlElement {
        let label = el("label", "slider-line");
        let caption = el("span", "");
        caption.set_text_content(Some(name));
        let input: HtmlInputElement = doc().create_element("input").unwrap().dyn_into().unwrap();
        input.set_class_name("skin-range");
        input.set_type("range");
        input.set_min(&min.to_string());
        input.set_max(&max.to_string());
        input.set_step(&step.to_string());
        input.set_value(&value.to_string());
        input.set_attribute("aria-label", aria).ok();
        let pct = if volume { value * 100.0 } else { ((value + 1.0) / 2.0) * 100.0 };
        let _ = input.style().set_property("--pct", &format!("{pct}%"));
        let node = input.clone();
        let closure = Closure::wrap(Box::new(move || {
            let next = node.value_as_number() as f32;
            let pct = if volume { next * 100.0 } else { ((next + 1.0) / 2.0) * 100.0 };
            let _ = node.style().set_property("--pct", &format!("{pct}%"));
            with(|player| {
                if volume {
                    player.volume = next;
                    if let Some(engine) = player.engine.as_ref() {
                        engine.set_volume(next);
                    }
                } else {
                    player.balance = next;
                    if let Some(engine) = player.engine.as_ref() {
                        engine.set_balance(next);
                    }
                }
            });
        }) as Box<dyn FnMut()>);
        input.set_oninput(Some(closure.as_ref().unchecked_ref()));
        closure.forget();
        label.append_child(&caption).ok();
        label.append_child(&input).ok();
        label
    }

    fn eq_window(&mut self) -> HtmlElement {
        let title = el("header", "skin-title");
        let mark = el("h2", "wordmark");
        mark.set_text_content(Some("EQ"));
        let fill = el("span", "title-fill");
        fill.set_text_content(Some("FLAT"));
        fill.set_id("eq-preset-label");
        title.append_child(&mark).ok();
        title.append_child(&fill).ok();
        self.eq_win.append_child(&title).ok();
        let body = el("div", "skin-body");
        let top = el("div", "eq-top");
        let on = el("button", "tool-btn on");
        on.set_text_content(Some("ON"));
        on.set_id("eq-on");
        on_click(&on, || with(Player::toggle_eq));
        let auto = el("button", "tool-btn");
        auto.set_text_content(Some("AUTO"));
        on_click(&auto, || with(|player| player.apply_preset(8)));
        let select: HtmlSelectElement = doc().create_element("select").unwrap().dyn_into().unwrap();
        select.set_class_name("tool-btn");
        select.set_attribute("aria-label", "EQ preset").ok();
        for (index, (name, _)) in PRESETS.iter().enumerate() {
            let option = doc().create_element("option").unwrap();
            option.set_attribute("value", &index.to_string()).ok();
            option.set_text_content(Some(name));
            select.append_child(&option).ok();
        }
        let select_node = select.clone();
        let closure = Closure::wrap(Box::new(move || {
            let index = select_node.value().parse().unwrap_or(0);
            with(|player| player.apply_preset(index));
        }) as Box<dyn FnMut()>);
        select.set_onchange(Some(closure.as_ref().unchecked_ref()));
        closure.forget();
        top.append_child(&on).ok();
        top.append_child(&auto).ok();
        top.append_child(&select).ok();
        body.append_child(&top).ok();
        let row = el("div", "fader-row");
        let scale = el("div", "scale");
        for mark in ["+12", "0", "-12"] {
            let item = el("span", "");
            item.set_text_content(Some(mark));
            scale.append_child(&item).ok();
        }
        row.append_child(&scale).ok();
        for index in 0..11 {
            row.append_child(&self.fader(index)).ok();
        }
        body.append_child(&row).ok();
        self.eq_win.append_child(&body).ok();
        self.eq_win.clone()
    }

    fn fader(&mut self, index: usize) -> HtmlElement {
        let fader = el("div", "fader");
        let hit = el("div", "fader-hit");
        hit.set_attribute("role", "slider").ok();
        hit.set_attribute("aria-label", LABELS[index]).ok();
        let groove = el("div", "fader-groove");
        let thumb = el("div", "fader-thumb");
        let _ = thumb.style().set_property("bottom", "calc(50% - 5px)");
        hit.append_child(&groove).ok();
        hit.append_child(&thumb).ok();
        let hit_node = hit.clone();
        let thumb_node = thumb.clone();
        self.thumbs.push(thumb);
        let closure = Closure::wrap(Box::new(move |event: Event| {
            if event.type_() == "pointermove" {
                let buttons = event.dyn_ref::<PointerEvent>().map(|pointer| pointer.buttons()).unwrap_or(0);
                if buttons == 0 {
                    return;
                }
            }
            let Ok(pointer) = event.dyn_into::<PointerEvent>() else { return };
            let rect = hit_node.get_bounding_client_rect();
            let y = f64::from(pointer.client_y());
            let t = (1.0 - (y - rect.top()) / rect.height().max(1.0)).clamp(0.0, 1.0);
            let db = ((-12.0 + t * 24.0) * 2.0).round() / 2.0;
            let pct = (db + 12.0) / 24.0 * 100.0;
            let _ = thumb_node.style().set_property("bottom", &format!("calc({pct}% - 5px)"));
            let _ = hit_node.set_pointer_capture(pointer.pointer_id());
            with(|player| player.set_band(index, db as f32));
        }) as Box<dyn FnMut(Event)>);
        hit.add_event_listener_with_callback("pointerdown", closure.as_ref().unchecked_ref()).ok();
        hit.add_event_listener_with_callback("pointermove", closure.as_ref().unchecked_ref()).ok();
        closure.forget();
        let caption = el("span", "fader-label");
        caption.set_text_content(Some(LABELS[index]));
        fader.append_child(&hit).ok();
        fader.append_child(&caption).ok();
        fader
    }

    fn pl_window(&mut self) -> HtmlElement {
        let title = el("header", "skin-title");
        let mark = el("h2", "wordmark");
        mark.set_text_content(Some("PL"));
        let fill = el("span", "title-fill");
        fill.set_text_content(Some("PLAYLIST"));
        title.append_child(&mark).ok();
        title.append_child(&fill).ok();
        self.pl_win.append_child(&title).ok();
        let body = el("div", "skin-body");
        body.append_child(&self.list).ok();
        body.append_child(&self.foot).ok();
        let tools = el("div", "plist-tools");
        let add = el("button", "tool-btn");
        add.set_text_content(Some("ADD"));
        let file = self.file.clone();
        on_click(&add, move || {
            file.click();
        });
        tools.append_child(&add).ok();
        body.append_child(&tools).ok();
        self.pl_win.append_child(&body).ok();
        self.pl_win.clone()
    }

    fn refresh_rows(&mut self) {
        while let Some(child) = self.list.first_child() {
            let _ = self.list.remove_child(&child);
        }
        self.rows.clear();
        for (index, track) in self.tracks.iter().enumerate() {
            let row = el("button", "row");
            let num = el("span", "");
            num.set_text_content(Some(&format!("{index:02}")));
            let label = el("span", "");
            label.set_text_content(Some(&format!("{} — {}", track.artist, track.title)));
            let when = el("span", "when");
            when.set_text_content(Some(&fmt(track.duration)));
            row.append_child(&num).ok();
            row.append_child(&label).ok();
            row.append_child(&when).ok();
            on_click(&row, move || with(move |player| player.play_index(index)));
            self.list.append_child(&row).ok();
            self.rows.push(row);
        }
        let total: f64 = self.tracks.iter().map(|track| track.duration).sum();
        self.foot.set_text_content(Some(&format!("{} tracks · {}", self.tracks.len(), fmt(total))));
        self.mark_rows();
    }

    fn mark_rows(&self) {
        for (index, row) in self.rows.iter().enumerate() {
            row.set_class_name(if index == self.current { "row now" } else { "row" });
        }
    }

    fn arm(&mut self) {
        let closure = Closure::wrap(Box::new(|| with(Player::tick)) as Box<dyn FnMut()>);
        self.timer = window()
            .unwrap()
            .set_interval_with_callback_and_timeout_and_arguments_0(closure.as_ref().unchecked_ref(), 80)
            .unwrap_or(0);
        closure.forget();
        let keys = Closure::wrap(Box::new(|event: Event| {
            let Ok(key) = event.dyn_into::<KeyboardEvent>() else { return };
            let name = key.key();
            if name == " " || name.starts_with("Arrow") {
                key.prevent_default();
            }
            with(|player| match name.as_str() {
                " " => player.press_play_toggle(),
                "z" | "ArrowLeft" => player.nudge(-5.0),
                "b" | "ArrowRight" => player.nudge(5.0),
                "x" => player.press_play(),
                "c" => player.pause(),
                "v" => player.stop(),
                "n" => player.next(false),
                "ArrowUp" => player.nudge_volume(0.05),
                "ArrowDown" => player.nudge_volume(-0.05),
                "s" => player.toggle_shuffle(),
                "r" => player.cycle_repeat(),
                "q" => player.toggle_eq_win(),
                "p" => player.toggle_pl_win(),
                _ => {}
            });
        }) as Box<dyn FnMut(Event)>);
        window()
            .unwrap()
            .add_event_listener_with_callback("keydown", keys.as_ref().unchecked_ref())
            .ok();
        self.keys = Some(keys);
        let file = self.file.clone();
        let drop = Closure::wrap(Box::new(move |event: Event| {
            event.prevent_default();
            let Some(drag) = event.dyn_ref::<web_sys::DragEvent>() else { return };
            let Some(data) = drag.data_transfer() else { return };
            let Some(files) = data.files() else { return };
            let _ = &file;
            add_files(files);
        }) as Box<dyn FnMut(Event)>);
        self.root.add_event_listener_with_callback("dragover", drop.as_ref().unchecked_ref()).ok();
        self.root.add_event_listener_with_callback("drop", drop.as_ref().unchecked_ref()).ok();
        drop.forget();
    }

    fn teardown(&mut self) {
        if let Some(engine) = self.engine.as_mut() {
            engine.stop();
        }
        if self.timer != 0 {
            window().unwrap().clear_interval_with_handle(self.timer);
            self.timer = 0;
        }
        if let Some(keys) = self.keys.take() {
            window()
                .unwrap()
                .remove_event_listener_with_callback("keydown", keys.as_ref().unchecked_ref())
                .ok();
        }
        self.root.remove();
    }

    fn tick(&mut self) {
        self.paint_text();
        self.paint_bars();
    }

    fn paint_text(&mut self) {
        let (position, duration, playing) = self
            .engine
            .as_ref()
            .map(|engine| (engine.position(), engine.duration(), engine.playing))
            .unwrap_or((0.0, self.tracks.first().map(|track| track.duration).unwrap_or(0.0), false));
        self.digits.set_text_content(Some(&fmt(position)));
        self.sub.set_text_content(Some(&fmt(duration)));
        if !self.scrubbing {
            self.seek.set_max(&duration.max(0.1).to_string());
            self.seek.set_value(&position.to_string());
            let pct = if duration > 0.0 { position / duration * 100.0 } else { 0.0 };
            let _ = self.seek.style().set_property("--pct", &format!("{pct}%"));
        }
        let track = self.tracks.get(self.current);
        let text = match track {
            Some(track) if playing || position > 0.0 => {
                format!("{}  -  {}   {}/{}", track.artist, track.title, self.current + 1, self.tracks.len())
            }
            _ => "RUST  -  press play".to_string(),
        };
        self.ticker.set_text_content(Some(&text));
        self.ticker.set_class_name(if playing { "ticker-track" } else { "" });
    }

    fn paint_bars(&self) {
        let playing = self.engine.as_ref().map(|engine| engine.playing).unwrap_or(false);
        if !playing {
            for bar in &self.bars {
                let _ = bar.style().set_property("height", "2px");
            }
            return;
        }
        let mut bins = [0u8; 512];
        if let Some(engine) = self.engine.as_ref() {
            engine.bins(&mut bins);
        }
        for (index, bar) in self.bars.iter().enumerate() {
            let start = index * 70 / self.bars.len();
            let end = (index + 1) * 70 / self.bars.len();
            let peak = bins[start..=end].iter().copied().max().unwrap_or(0);
            let height = (peak as f32 / 255.0 * 100.0).max(2.0);
            let _ = bar.style().set_property("height", &format!("{height}%"));
        }
    }

    fn ensure(&mut self) {
        if self.engine.is_some() {
            return;
        }
        if let Ok(engine) = Engine::new() {
            engine.set_volume(self.volume);
            engine.set_balance(self.balance);
            engine.set_eq(self.eq_on, &self.bands);
            self.engine = Some(engine);
        }
    }

    fn play_index(&mut self, index: usize) {
        if index >= self.tracks.len() {
            return;
        }
        self.current = index;
        self.ensure();
        let Some(buffer) = self.buffer_for(index) else {
            self.ticker.set_text_content(Some("Audio failed"));
            return;
        };
        let ended = end_closure();
        let started = self.engine.as_mut().and_then(|engine| engine.play_buffer(buffer, ended).ok()).is_some();
        if !started {
            self.ticker.set_text_content(Some("Audio failed"));
        }
        self.mark_rows();
        self.paint_text();
    }

    fn buffer_for(&mut self, index: usize) -> Option<AudioBuffer> {
        match &self.tracks[index].kind {
            Kind::Demo(demo) => {
                let demo = *demo;
                if let Some(buffer) = self.cache[demo].clone() {
                    return Some(buffer);
                }
                let sr = self.engine.as_ref()?.sample_rate();
                let (mut left, mut right) = synth::render(&DEMOS[demo], sr);
                let options = web_sys::AudioBufferOptions::new(left.len() as u32, sr as f32);
                options.set_number_of_channels(2);
                let buffer = AudioBuffer::new(&options).ok()?;
                buffer.copy_to_channel(&mut left, 0).ok()?;
                buffer.copy_to_channel(&mut right, 1).ok()?;
                self.cache[demo] = Some(buffer.clone());
                Some(buffer)
            }
            Kind::File(buffer) => Some(buffer.clone()),
        }
    }

    fn press_play(&mut self) {
        self.ensure();
        let playing = self.engine.as_ref().map(|engine| engine.playing).unwrap_or(false);
        let has = self.engine.as_ref().map(|engine| engine.has_buffer()).unwrap_or(false);
        if has && !playing {
            let ended = end_closure();
            if let Some(engine) = self.engine.as_mut() {
                engine.resume(ended).ok();
            }
            self.paint_text();
            return;
        }
        if !playing {
            self.play_index(self.current);
        }
    }

    fn press_play_toggle(&mut self) {
        let playing = self.engine.as_ref().map(|engine| engine.playing).unwrap_or(false);
        if playing {
            self.pause();
        } else {
            self.press_play();
        }
    }

    fn pause(&mut self) {
        if let Some(engine) = self.engine.as_mut() {
            engine.pause();
        }
        self.paint_text();
        self.paint_bars();
    }

    fn stop(&mut self) {
        if let Some(engine) = self.engine.as_mut() {
            engine.stop();
        }
        self.paint_text();
        self.paint_bars();
    }

    fn next(&mut self, from_end: bool) {
        let count = self.tracks.len();
        if count == 0 {
            return;
        }
        let index = if self.shuffle && count > 1 {
            let hop = 1 + (js_sys::Math::random() * (count as f64 - 1.0)) as usize;
            (self.current + hop) % count
        } else if self.current + 1 >= count {
            if from_end && self.repeat == 0 {
                self.stop();
                return;
            }
            0
        } else {
            self.current + 1
        };
        self.play_index(index);
    }

    fn prev(&mut self) {
        let position = self.engine.as_ref().map(|engine| engine.position()).unwrap_or(0.0);
        if position > 2.0 {
            self.seek_to(0.0);
            return;
        }
        let index = if self.current == 0 { self.tracks.len().saturating_sub(1) } else { self.current - 1 };
        self.play_index(index);
    }

    fn seek_to(&mut self, seconds: f64) {
        let ended = end_closure();
        if let Some(engine) = self.engine.as_mut() {
            engine.seek(seconds, Some(ended)).ok();
        }
        self.paint_text();
    }

    fn nudge(&mut self, delta: f64) {
        let position = self.engine.as_ref().map(|engine| engine.position()).unwrap_or(0.0);
        self.seek_to((position + delta).max(0.0));
    }

    fn nudge_volume(&mut self, delta: f32) {
        self.volume = (self.volume + delta).clamp(0.0, 1.0);
        if let Some(engine) = self.engine.as_ref() {
            engine.set_volume(self.volume);
        }
    }

    fn toggle_shuffle(&mut self) {
        self.shuffle = !self.shuffle;
    }

    fn cycle_repeat(&mut self) {
        self.repeat = (self.repeat + 1) % 3;
    }

    fn cycle_vis(&mut self) {
        let hidden = self.bars.first().and_then(|bar| bar.parent_element()).map(|parent| parent.has_attribute("data-off")).unwrap_or(false);
        if let Some(parent) = self.bars.first().and_then(|bar| bar.parent_element()) {
            if hidden {
                parent.remove_attribute("data-off").ok();
            } else {
                parent.set_attribute("data-off", "").ok();
                for bar in &self.bars {
                    let _ = bar.style().set_property("height", "2px");
                }
            }
        }
    }

    fn toggle_eq(&mut self) {
        self.eq_on = !self.eq_on;
        if let Some(engine) = self.engine.as_ref() {
            engine.set_eq(self.eq_on, &self.bands);
        }
        if let Some(button) = doc().get_element_by_id("eq-on") {
            button.set_class_name(if self.eq_on { "tool-btn on" } else { "tool-btn" });
        }
    }

    fn toggle_eq_win(&mut self) {
        self.show_eq = !self.show_eq;
        self.eq_win.set_hidden(!self.show_eq);
        self.eq_btn.set_class_name(if self.show_eq { "tool-btn on" } else { "tool-btn" });
        self.root.set_class_name(if self.show_pl { "desk split" } else { "desk" });
    }

    fn toggle_pl_win(&mut self) {
        self.show_pl = !self.show_pl;
        self.pl_win.set_hidden(!self.show_pl);
        self.pl_btn.set_class_name(if self.show_pl { "tool-btn on" } else { "tool-btn" });
        self.root.set_class_name(if self.show_pl { "desk split" } else { "desk" });
    }

    fn set_band(&mut self, index: usize, value: f32) {
        self.bands[index] = value;
        if let Some(engine) = self.engine.as_ref() {
            engine.set_eq(self.eq_on, &self.bands);
        }
        if let Some(label) = doc().get_element_by_id("eq-preset-label") {
            label.set_text_content(Some("MANUAL"));
        }
    }

    fn apply_preset(&mut self, index: usize) {
        let Some((_, curve)) = PRESETS.get(index) else { return };
        self.bands = *curve;
        self.eq_on = true;
        if let Some(engine) = self.engine.as_ref() {
            engine.set_eq(true, &self.bands);
        }
        for (band, thumb) in self.bands.iter().zip(self.thumbs.iter()) {
            let pct = (band + 12.0) / 24.0 * 100.0;
            let _ = thumb.style().set_property("bottom", &format!("calc({pct}% - 5px)"));
        }
        if let Some(label) = doc().get_element_by_id("eq-preset-label") {
            label.set_text_content(Some(&PRESETS[index].0.to_uppercase()));
        }
        if let Some(button) = doc().get_element_by_id("eq-on") {
            button.set_class_name("tool-btn on");
        }
    }

    fn push_decoded(&mut self, name: String, buffer: AudioBuffer) {
        let (artist, title) = split_name(&name);
        self.tracks.push(Track {
            artist,
            title,
            duration: buffer.duration(),
            kind: Kind::File(buffer),
        });
        let index = self.tracks.len() - 1;
        self.refresh_rows();
        self.play_index(index);
    }

    fn natural_end(&mut self) {
        if let Some(engine) = self.engine.as_mut() {
            engine.note_ended();
        }
        if self.repeat == 2 {
            self.play_index(self.current);
            return;
        }
        self.next(true);
    }
}

fn end_closure() -> Closure<dyn FnMut()> {
    let epoch = EPOCH.with(|epoch| {
        let next = epoch.get().wrapping_add(1);
        epoch.set(next);
        next
    });
    Closure::wrap(Box::new(move || {
        if EPOCH.with(|current| current.get()) != epoch {
            return;
        }
        let defer = Closure::once(Box::new(|| with(Player::natural_end)) as Box<dyn FnOnce()>);
        let _ = window().unwrap().set_timeout_with_callback_and_timeout_and_arguments_0(
            defer.as_ref().unchecked_ref(),
            0,
        );
        defer.forget();
    }) as Box<dyn FnMut()>)
}

fn add_files(list: FileList) {
    with(Player::ensure);
    let Some(ctx) = PLAYER.with(|slot| {
        slot.borrow().as_ref().and_then(|player| player.engine.as_ref().map(|engine| engine.context().clone()))
    }) else {
        return;
    };
    for index in 0..list.length() {
        let Some(file) = list.get(index) else { continue };
        let name = file.name();
        let ctx = ctx.clone();
        wasm_bindgen_futures::spawn_local(async move {
            let Ok(value) = JsFuture::from(file.array_buffer()).await else { return };
            let Ok(bytes) = value.dyn_into::<ArrayBuffer>() else { return };
            let Ok(promise) = ctx.decode_audio_data(&bytes) else { return };
            let Ok(decoded) = JsFuture::from(promise).await else { return };
            let Ok(buffer) = decoded.dyn_into::<AudioBuffer>() else { return };
            with(|player| player.push_decoded(name, buffer));
        });
    }
}

fn demo_tracks() -> Vec<Track> {
    DEMOS
        .iter()
        .enumerate()
        .map(|(index, demo)| Track {
            artist: demo.artist.to_string(),
            title: demo.title.to_string(),
            duration: synth::duration(demo),
            kind: Kind::Demo(index),
        })
        .collect()
}

fn split_name(name: &str) -> (String, String) {
    let stem = name.rsplit_once('.').map(|(stem, _)| stem).unwrap_or(name);
    match stem.split_once(" - ") {
        Some((artist, title)) => (artist.to_string(), title.to_string()),
        None => ("Local".to_string(), stem.to_string()),
    }
}

fn fmt(seconds: f64) -> String {
    let seconds = if seconds.is_finite() && seconds > 0.0 { seconds } else { 0.0 };
    let whole = seconds.floor() as u32;
    format!("{}:{:02}", whole / 60, whole % 60)
}
