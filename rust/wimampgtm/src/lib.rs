mod audio;
mod synth;
mod ui;

use std::cell::Cell;
use wasm_bindgen::prelude::*;

thread_local! {
    static BOOTED: Cell<bool> = const { Cell::new(false) };
}

#[wasm_bindgen]
pub fn start() {
    console_error_panic_hook::set_once();
    ui::mount();
    BOOTED.with(|flag| flag.set(true));
}

#[wasm_bindgen]
pub fn stop() {
    if BOOTED.with(|flag| flag.get()) {
        ui::shutdown();
    }
}
