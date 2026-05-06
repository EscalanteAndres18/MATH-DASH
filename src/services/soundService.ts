const audioCtx = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (freq: number, type: OscillatorType, duration: number, volume: number = 0.1) => {
  if (!audioCtx) return;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
  
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
};

export const SoundService = {
  playClick: () => {
    playTone(800, 'sine', 0.1, 0.05);
  },
  
  playCorrect: () => {
    const now = audioCtx?.currentTime || 0;
    playTone(523.25, 'sine', 0.2, 0.1); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.3, 0.1), 100); // E5
  },
  
  playIncorrect: () => {
    playTone(150, 'sawtooth', 0.4, 0.05);
  },
  
  playFinish: () => {
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    melody.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'triangle', 0.5, 0.1), i * 150);
    });
  }
};
