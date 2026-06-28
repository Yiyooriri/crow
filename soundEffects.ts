let audioContext: AudioContext | null = null;
let audioUnlocked = false;

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return null;
  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }
  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }
  return audioContext;
}

export function unlockAudio() {
  const context = getAudioContext();
  if (!context || audioUnlocked) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  gain.gain.setValueAtTime(0.0001, start);
  oscillator.frequency.setValueAtTime(28, start);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.035);
  audioUnlocked = true;
}

function withEnvelope(gain: GainNode, start: number, peak: number, duration: number) {
  gain.gain.cancelScheduledValues(start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
}

function playTone(
  frequency: number,
  duration: number,
  peak: number,
  type: OscillatorType,
  detune = 0,
  cutoff = 1200,
) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  oscillator.detune.setValueAtTime(detune, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(cutoff, start);
  filter.Q.setValueAtTime(1.05, start);

  withEnvelope(gain, start, peak, duration);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

export function playButtonSound() {
  playTone(260, 0.13, 0.042, "triangle", -9, 520);
  window.setTimeout(() => playTone(390, 0.12, 0.024, "sine", 2, 680), 28);
}

export function playDropSound() {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(86, start);
  oscillator.frequency.exponentialRampToValueAtTime(31, start + 0.78);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(360, start);
  filter.frequency.exponentialRampToValueAtTime(110, start + 0.78);

  withEnvelope(gain, start, 0.12, 0.82);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + 0.9);
}

export function playPassSound() {
  playTone(124, 0.32, 0.075, "triangle", -6, 420);
  window.setTimeout(() => playTone(260, 0.28, 0.04, "sine", 3, 560), 58);
  window.setTimeout(() => playTone(440, 0.3, 0.022, "triangle", 0, 680), 125);
}

export function playPinHitSound(force = 1) {
  const context = getAudioContext();
  if (!context) return;
  const start = context.currentTime;
  const clamped = Math.max(0.35, Math.min(force, 1.35));
  const oscillator = context.createOscillator();
  const modulator = context.createOscillator();
  const modGain = context.createGain();
  const gain = context.createGain();
  const filter = context.createBiquadFilter();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(112 + Math.random() * 28, start);
  oscillator.frequency.exponentialRampToValueAtTime(54 + Math.random() * 18, start + 0.24);
  modulator.type = "sine";
  modulator.frequency.setValueAtTime(12 + Math.random() * 8, start);
  modGain.gain.setValueAtTime(9 * clamped, start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(300 + Math.random() * 120, start);
  filter.Q.setValueAtTime(1.7, start);

  withEnvelope(gain, start, 0.055 * clamped, 0.28);
  modulator.connect(modGain);
  modGain.connect(oscillator.frequency);
  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  modulator.start(start);
  oscillator.stop(start + 0.32);
  modulator.stop(start + 0.32);
}
