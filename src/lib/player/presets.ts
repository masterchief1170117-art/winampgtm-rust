export const FREQS = [60, 170, 310, 600, 1000, 3000, 6000, 12000, 14000, 16000];

export const FREQ_LABELS = ["60", "170", "310", "600", "1K", "3K", "6K", "12K", "14K", "16K"];

/** Index 0 is preamp. The next ten are the graphic bands, in dB. */
export const PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  Rock: [0, 5, 3, -1, -2, -1, 2, 4, 5, 5, 5],
  Dance: [0, 6, 4, 1, 0, -1, -1, 0, 3, 4, 4],
  Pop: [0, -1, 2, 4, 4, 2, 0, -1, -1, -1, -1],
  Classical: [0, 4, 3, 2, 1, -1, -1, 0, 2, 3, 4],
  Bass: [2, 7, 6, 4, 2, 0, 0, 0, 0, 0, 0],
  Treble: [0, 0, 0, 0, 0, 1, 3, 5, 6, 7, 7],
  Vocal: [0, -2, -1, 1, 3, 4, 4, 2, 0, -1, -2],
  Laptop: [3, 4, 5, 3, 0, -2, -1, 1, 3, 4, 3],
  Soft: [-2, 2, 1, 0, -1, -1, 0, 1, 2, 2, 1],
};

export const PRESET_NAMES = Object.keys(PRESETS);

export const AUTO_CURVE = [1, 3, 2, 1, 0, -1, 0, 1, 2, 3, 3];

export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}
