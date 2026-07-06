'use client';

/**
 * 2027-grade notification sound using Web Audio API.
 * Pleasant, non-intrusive two-tone chime.
 * No external files required.
 */
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  const w = window as Window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextCtor = window.AudioContext || w.webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!audioContext) {
    audioContext = new AudioContextCtor();
  }

  return audioContext;
}

function playChime(audio: AudioContext, volume: number) {
  const t = audio.currentTime;

  const o1 = audio.createOscillator();
  const g1 = audio.createGain();
  o1.type = 'sine';
  o1.frequency.value = 932;
  g1.gain.value = volume * 0.9;

  const o2 = audio.createOscillator();
  const g2 = audio.createGain();
  o2.type = 'sine';
  o2.frequency.value = 698;
  g2.gain.value = volume * 0.75;

  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 1800;

  o1.connect(g1);
  g1.connect(filter);
  o2.connect(g2);
  g2.connect(filter);
  filter.connect(audio.destination);

  o1.start(t);
  o1.stop(t + 0.2);
  o2.start(t + 0.08);
  o2.stop(t + 0.38);

  g1.gain.linearRampToValueAtTime(0.001, t + 0.28);
  g2.gain.linearRampToValueAtTime(0.001, t + 0.45);
}

export function playNotificationSound(volume = 0.12) {
  if (typeof window === 'undefined') return;

  try {
    const audio = getAudioContext();
    if (!audio) return;

    if (audio.state === 'suspended') {
      void audio.resume().then(() => playChime(audio, volume)).catch(() => {});
      return;
    }

    playChime(audio, volume);
  } catch {
    // Audio blocked until user interaction - this is normal
  }
}
