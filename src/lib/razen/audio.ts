/**
 * Lightweight Web Audio API sound system — no audio files needed.
 * Generates subtle UI feedback tones on demand. Respects user setting
 * and only initializes on first user interaction (browser autoplay policy).
 */

type SoundName = "tap" | "success" | "error" | "whoosh" | "tick" | "confirm";

let ctx: AudioContext | null = null;
let enabled = true;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
  return ctx;
}

/** Call on first user gesture to unlock audio. */
export function unlockAudio() {
  ensureCtx();
}

export function setAudioEnabled(v: boolean) {
  enabled = v;
}

export function isAudioEnabled() {
  return enabled;
}

function tone(
  ac: AudioContext,
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  delay = 0,
  freqEnd?: number,
) {
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const ac = ensureCtx();
  if (!ac) return;
  if (ac.state === "suspended") void ac.resume();

  switch (name) {
    case "tap":
      tone(ac, 660, 0.06, "sine", 0.04);
      break;
    case "tick":
      tone(ac, 880, 0.03, "square", 0.02);
      break;
    case "whoosh":
      tone(ac, 220, 0.18, "sine", 0.05, 0, 660);
      break;
    case "confirm":
      tone(ac, 523, 0.08, "sine", 0.05);
      tone(ac, 784, 0.12, "sine", 0.04, 0.06);
      break;
    case "success":
      tone(ac, 523, 0.1, "sine", 0.06);
      tone(ac, 659, 0.1, "sine", 0.05, 0.08);
      tone(ac, 784, 0.14, "sine", 0.05, 0.16);
      break;
    case "error":
      tone(ac, 220, 0.12, "sawtooth", 0.05);
      tone(ac, 180, 0.16, "sawtooth", 0.04, 0.08);
      break;
  }
}
