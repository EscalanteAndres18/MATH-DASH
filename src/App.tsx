import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Settings, 
  Play, 
  RotateCcw, 
  Delete, 
  Check, 
  Users, 
  Plus, 
  Minus, 
  X,
  Divide,
  Keyboard,
  Gamepad2,
  Pause,
  Home,
  Monitor,
  ChevronRight,
  ChevronLeft,
  CircleStop,
  Globe
} from 'lucide-react';
import { SoundService } from './services/soundService';
import { Language, translations } from './i18n';

// --- Types ---

type Operation = 'addition' | 'subtraction' | 'multiplication' | 'division';
type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard';

type KeyboardProfile = 'digits' | 'numpad';

type InputDevice = 
  | { type: 'screen' }
  | { type: 'keyboard', profile: KeyboardProfile }
  | { type: 'hid', deviceId: string, name: string };

interface GameConfig {
  playerCount: number;
  targetScore: number;
  operations: Operation[];
  playerInputDevices: InputDevice[];
  playerDifficulties: Difficulty[];
}

interface Problem {
  id: string;
  question: string;
  answer: number;
  parts: { a: number; b: number; op: string };
}

interface PlayerState {
  id: number;
  score: number;
  currentProblem: Problem;
  userInput: string;
  isCorrect: boolean | null;
  color: string;
  character: string;
  inputDevice: InputDevice;
  difficulty: Difficulty;
}

// --- Constants ---

const PLAYER_COLORS = [
  'bg-cyan-500', 
  'bg-rose-500', 
  'bg-amber-500', 
  'bg-emerald-500'
];

const BORDER_COLORS = [
  'border-cyan-200',
  'border-rose-200',
  'border-amber-200',
  'border-emerald-200'
];

const CHARACTERS = ['🐱', '🐶', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷'];

// --- Utilities ---

const generateProblem = (operations: Operation[], difficulty: Difficulty): Problem => {
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a = 0, b = 0, answer = 0, opSymbol = '';

  switch (difficulty) {
    case 'beginner': // Ages 3-5
      if (op === 'multiplication' || op === 'division' || op === 'addition') {
        a = Math.floor(Math.random() * 5);
        b = Math.floor(Math.random() * 5);
        answer = a + b;
        opSymbol = '+';
      } else { // subtraction
        a = Math.floor(Math.random() * 5) + 1;
        b = Math.floor(Math.random() * a);
        answer = a - b;
        opSymbol = '-';
      }
      break;
    case 'easy': // Ages 6-8
      if (op === 'multiplication') {
        a = Math.floor(Math.random() * 5) + 1;
        b = Math.floor(Math.random() * 5) + 1;
        answer = a * b;
        opSymbol = '×';
      } else if (op === 'addition') {
        a = Math.floor(Math.random() * 15) + 1;
        b = Math.floor(Math.random() * 15) + 1;
        answer = a + b;
        opSymbol = '+';
      } else if (op === 'subtraction') {
        a = Math.floor(Math.random() * 15) + 5;
        b = Math.floor(Math.random() * (a - 1)) + 1;
        answer = a - b;
        opSymbol = '-';
      } else { // division
        b = Math.floor(Math.random() * 4) + 1;
        answer = Math.floor(Math.random() * 5) + 1;
        a = answer * b;
        opSymbol = '÷';
      }
      break;
    case 'medium': // Ages 9-11
      if (op === 'addition') {
        a = Math.floor(Math.random() * 40) + 10;
        b = Math.floor(Math.random() * 40) + 10;
        answer = a + b;
        opSymbol = '+';
      } else if (op === 'subtraction') {
        a = Math.floor(Math.random() * 80) + 20;
        b = Math.floor(Math.random() * (a - 10)) + 5;
        answer = a - b;
        opSymbol = '-';
      } else if (op === 'multiplication') {
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        answer = a * b;
        opSymbol = '×';
      } else { // division
        b = Math.floor(Math.random() * 8) + 2;
        answer = Math.floor(Math.random() * 10) + 1;
        a = answer * b;
        opSymbol = '÷';
      }
      break;
    case 'hard': // Ages 12+
      if (op === 'addition') {
        a = Math.floor(Math.random() * 100) + 50;
        b = Math.floor(Math.random() * 100) + 50;
        answer = a + b;
        opSymbol = '+';
      } else if (op === 'subtraction') {
        a = Math.floor(Math.random() * 200) + 100;
        b = Math.floor(Math.random() * (a - 50)) + 20;
        answer = a - b;
        opSymbol = '-';
      } else if (op === 'multiplication') {
        a = Math.floor(Math.random() * 15) + 2;
        b = Math.floor(Math.random() * 15) + 2;
        answer = a * b;
        opSymbol = '×';
      } else { // division
        b = Math.floor(Math.random() * 12) + 2;
        answer = Math.floor(Math.random() * 15) + 2;
        a = answer * b;
        opSymbol = '÷';
      }
      break;
  }

  return {
    id: Math.random().toString(36).substr(2, 9),
    question: `${a} ${opSymbol} ${b}`,
    answer,
    parts: { a, b, op: opSymbol }
  };
};

// --- Components ---

const Numpad = ({ 
  onPress, 
  onDelete, 
  onConfirm, 
}: { 
  onPress: (val: string) => void, 
  onDelete: () => void, 
  onConfirm: () => void,
}) => {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  
  return (
    <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mt-4">
      {keys.map((key) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            SoundService.playClick();
            onPress(key);
          }}
          className="h-16 rounded-2xl bg-white/20 backdrop-blur-md text-white font-black text-2xl flex items-center justify-center border-b-8 border-black/20 hover:bg-white/30 transition-colors"
        >
          {key}
        </motion.button>
      ))}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
            SoundService.playClick();
            onDelete();
        }}
        className="h-16 rounded-2xl bg-red-500/60 backdrop-blur-md text-white font-bold text-2xl flex items-center justify-center border-b-8 border-black/20"
      >
        <Delete size={28} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
            // Sound is handled in handleConfirm if needed, 
            // but for UI consistency let's play click here too or just let handleConfirm play its own
            onConfirm();
        }}
        className="h-16 rounded-2xl bg-green-500/60 backdrop-blur-md text-white font-bold text-2xl flex items-center justify-center border-b-8 border-black/20"
      >
        <Check size={28} />
      </motion.button>
    </div>
  );
};

const RaceTrack = ({ players, playerCount, targetScore }: { players: PlayerState[], playerCount: number, targetScore: number }) => (
  <div className="absolute top-0 left-0 right-0 h-24 bg-black/40 backdrop-blur-xl border-b border-white/10 z-[100] flex items-center px-8 overflow-hidden">
      <div className="relative w-full h-12 bg-white/5 rounded-full flex items-center px-4">
          <div className="absolute right-12 top-2 bottom-2 w-1 bg-yellow-400/50 dashed" />
          <Trophy size={24} className="absolute right-4 text-yellow-400 animate-pulse" />
          
          {players.map((p) => (
              <motion.div
                 key={p.id}
                 animate={{ 
                   left: `${Math.min(90, (p.score / targetScore) * 90)}%`,
                   y: (p.id - playerCount / 2) * 8
                 }}
                 transition={{ type: 'spring', damping: 15 }}
                 className="absolute flex flex-col items-center"
              >
                  <span className="text-4xl drop-shadow-lg z-10">{p.character}</span>
                  <div className={`w-3 h-3 ${p.color} rounded-full mt-1 border-2 border-white`} />
              </motion.div>
          ))}
      </div>
  </div>
);

const PauseMenu = ({ t, onResume, onMainMenu }: { t: any, onResume: () => void, onMainMenu: () => void }) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="fixed inset-0 z-[200] bg-indigo-950/80 backdrop-blur-xl flex flex-col items-center justify-center"
  >
      <h2 className="text-6xl font-black text-white mb-12 tracking-tighter uppercase">{t.gamePaused}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl px-6">
          <button
              onClick={() => {
                SoundService.playClick();
                onResume();
              }}
              className="bg-emerald-500 text-white p-8 rounded-[40px] font-black text-3xl shadow-2xl hover:scale-105 transition-all flex flex-col items-center gap-4 uppercase"
          >
              <Play size={48} fill="currentColor" /> {t.resume}
          </button>
          <button
              onClick={() => {
                SoundService.playClick();
                onMainMenu();
              }}
              className="bg-rose-500 text-white p-8 rounded-[40px] font-black text-3xl shadow-2xl hover:scale-105 transition-all flex flex-col items-center gap-4 uppercase"
          >
              <Home size={48} /> {t.mainMenu}
          </button>
      </div>
  </motion.div>
);

export default function App() {
  const [language, setLanguage] = useState<Language>('en');
  const t = translations[language];

  const [gameStatus, setGameStatus] = useState<'SETUP' | 'PLAYING' | 'PAUSED' | 'WINNER'>('SETUP');
  const [config, setConfig] = useState<GameConfig>({
    playerCount: 2,
    targetScore: 10,
    operations: ['addition'],
    playerInputDevices: [
      { type: 'keyboard', profile: 'digits' },
      { type: 'keyboard', profile: 'numpad' }
    ],
    playerDifficulties: ['beginner', 'beginner', 'beginner', 'beginner']
  });
  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [winner, setWinner] = useState<PlayerState | null>(null);

  const startGame = () => {
    SoundService.playClick();
    const initialPlayers = Array.from({ length: config.playerCount }).map((_, i) => ({
      id: i,
      score: 0,
      currentProblem: generateProblem(config.operations, config.playerDifficulties[i]),
      userInput: '',
      isCorrect: null,
      color: PLAYER_COLORS[i],
      character: CHARACTERS[i % CHARACTERS.length],
      inputDevice: config.playerInputDevices[i],
      difficulty: config.playerDifficulties[i]
    }));
    setPlayers(initialPlayers);
    setGameStatus('PLAYING');
  };

  const handleInput = useCallback((playerId: number, value: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId && p.userInput.length < 5) {
        return { ...p, userInput: p.userInput + value };
      }
      return p;
    }));
  }, []);

  const handleDelete = useCallback((playerId: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        return { ...p, userInput: p.userInput.slice(0, -1) };
      }
      return p;
    }));
  }, []);

  const setPlayerInput = useCallback((playerId: number, value: string) => {
    setPlayers(prev => prev.map(p => {
      if (p.id === playerId) {
        // Limit to 5 digits and only allow numbers
        const sanitized = value.replace(/[^0-9]/g, '').slice(0, 5);
        return { ...p, userInput: sanitized };
      }
      return p;
    }));
  }, []);

  const handleConfirm = useCallback((playerId: number) => {
    setPlayers(prev => {
      const player = prev.find(p => p.id === playerId);
      if (!player || player.userInput === '') return prev;

      const isCorrect = parseInt(player.userInput) === player.currentProblem.answer;
      
      if (isCorrect) {
        SoundService.playCorrect();
        const nextScore = player.score + 1;
        if (nextScore >= config.targetScore) {
          SoundService.playFinish();
          setWinner({ ...player, score: nextScore });
          setGameStatus('WINNER');
        }
        return prev.map(p => {
          if (p.id === playerId) {
            return {
              ...p,
              score: nextScore,
              currentProblem: generateProblem(config.operations, p.difficulty),
              userInput: '',
              isCorrect: true
            };
          }
          return p;
        });
      } else {
        SoundService.playIncorrect();
        return prev.map(p => {
          if (p.id === playerId) {
            return { ...p, userInput: '', isCorrect: false };
          }
          return p;
        });
      }
    });

    setTimeout(() => {
      setPlayers(prev => prev.map(p => {
          if (p.id === playerId) return { ...p, isCorrect: null };
          return p;
      }));
    }, 600);
  }, [config.operations, config.targetScore]);

  // Input listeners
  useEffect(() => {
    if (gameStatus !== 'PLAYING') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // If a real input is focused by mistake, don't double-process
      if (document.activeElement instanceof HTMLInputElement) return;

      players.forEach(p => {
        if (p.inputDevice.type === 'keyboard') {
          const isDigits = p.inputDevice.profile === 'digits';
          const isNumpad = p.inputDevice.profile === 'numpad';

          // Routing logic: Digits vs Numpad
          if (isDigits) {
            if (e.code.startsWith('Digit') && e.code.length === 6) {
              handleInput(p.id, e.key);
            }
            if (e.code === 'Backspace') handleDelete(p.id);
            if (e.code === 'Enter' || e.code === 'Space') handleConfirm(p.id);
          } else if (isNumpad) {
            if (e.code.startsWith('Numpad') && e.code.length === 7 && !isNaN(parseInt(e.key))) {
              handleInput(p.id, e.key);
            }
            if (e.code === 'Delete' || e.code === 'NumpadBackspace') handleDelete(p.id); // Some OS/Keys map backspace to delete on numpad
            if (e.code === 'NumpadEnter') handleConfirm(p.id);
          }
        }
      });

      // Special global shortcut: ESC to pause
      if (e.key === 'Escape') setGameStatus('PAUSED');
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStatus, players, handleInput, handleDelete, handleConfirm]);

  if (gameStatus === 'SETUP') {
    return (
      <div className="min-h-screen bg-[#070b14] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-[60px] p-12 w-full max-w-5xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-yellow-100 rounded-full blur-3xl opacity-50" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-6">
                    <div className="p-6 bg-yellow-400 rounded-3xl shadow-xl rotate-6 animate-bounce">
                        <Play className="text-white" size={48} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-6xl font-black text-indigo-950 tracking-tight leading-none mb-2">{t.title}</h1>
                        <p className="text-indigo-400 font-bold tracking-[0.4em] uppercase text-sm">{t.subtitle}</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                    <div className="flex bg-indigo-50 p-1 rounded-2xl border-2 border-indigo-100">
                        {(['en', 'es'] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => {
                                    SoundService.playClick();
                                    setLanguage(lang);
                                }}
                                className={`px-4 py-2 rounded-xl font-black text-sm transition-all ${
                                    language === lang
                                        ? 'bg-indigo-600 text-white shadow-lg'
                                        : 'text-indigo-400 hover:bg-indigo-100'
                                }`}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-10">
                <section>
                  <label className="text-sm font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                    <Users size={18} /> {t.players}
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(n => (
                      <button
                        key={n}
                        onClick={() => {
                          SoundService.playClick();
                          setConfig(prev => ({ 
                              ...prev, 
                              playerCount: n,
                              playerInputDevices: prev.playerInputDevices.length >= n 
                                  ? prev.playerInputDevices.slice(0, n)
                                  : [...prev.playerInputDevices, ...Array(n - prev.playerInputDevices.length).fill({ type: 'screen' })]
                          }));
                        }}
                        className={`h-20 rounded-[28px] border-b-8 text-3xl font-black transition-all ${
                          config.playerCount === n 
                            ? 'bg-indigo-600 text-white border-indigo-800 scale-105 shadow-2xl' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="text-sm font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                    <Plus size={18} /> {t.operations}
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { value: 'addition', icon: <Plus size={24} />, label: t.sums },
                      { value: 'subtraction', icon: <Minus size={24} />, label: t.minus },
                      { value: 'multiplication', icon: <X size={24} />, label: t.multi },
                      { value: 'division', icon: <Divide size={24} />, label: t.divide }
                    ].map(op => (
                      <button
                        key={op.value}
                        onClick={() => {
                          SoundService.playClick();
                          const exists = config.operations.includes(op.value as Operation);
                          if (exists && config.operations.length > 1) {
                            setConfig(prev => ({ ...prev, operations: prev.operations.filter(o => o !== op.value) }));
                          } else if (!exists) {
                            setConfig(prev => ({ ...prev, operations: [...prev.operations, op.value as Operation] }));
                          }
                        }}
                        className={`flex items-center gap-3 px-8 py-5 rounded-3xl border-b-8 text-xl font-black transition-all ${
                          config.operations.includes(op.value as Operation)
                            ? 'bg-emerald-500 text-white border-emerald-700 scale-105 shadow-lg'
                            : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {op.icon} {op.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                   <label className="text-sm font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                    <Trophy size={18} /> {t.targetScore}
                  </label>
                  <div className="bg-indigo-50 p-6 rounded-[32px] flex items-center gap-8">
                    <input 
                      type="range" 
                      min="5" 
                      max="50" 
                      step="5"
                      value={config.targetScore}
                      onChange={(e) => setConfig(prev => ({ ...prev, targetScore: parseInt(e.target.value) }))}
                      className="flex-1 accent-indigo-600 h-2"
                    />
                    <div className="bg-white px-6 py-4 rounded-2xl shadow-sm border-b-4 border-indigo-100 min-w-[100px] text-center">
                      <span className="text-4xl font-black text-indigo-600 leading-none">{config.targetScore}</span>
                      <p className="text-[10px] font-bold text-indigo-300 uppercase mt-1">{t.steps}</p>
                    </div>
                  </div>
                </section>
              </div>

              <div className="space-y-6">
                <label className="text-sm font-black text-indigo-300 uppercase tracking-[0.2em] flex items-center gap-2 mb-6">
                  <Keyboard size={18} /> {t.playerControls}
                </label>
                <div className="space-y-4 max-h-[440px] overflow-y-auto pr-4 custom-scrollbar">
                  {Array.from({ length: config.playerCount }).map((_, i) => (
                    <div key={i} className="bg-indigo-50 p-6 rounded-[32px] border-2 border-transparent hover:border-indigo-200 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-full ${PLAYER_COLORS[i]} flex items-center justify-center text-white font-black shadow-lg`}>
                            {i + 1}
                          </div>
                          <span className="font-black text-indigo-950 text-lg uppercase">{t.winner} {i + 1}</span>
                        </div>
                        <span className="text-3xl">{CHARACTERS[i]}</span>
                      </div>

                      <div className="mb-4">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t.difficulty}</p>
                        <div className="grid grid-cols-4 gap-1">
                          {[
                            { id: 'beginner', label: t.age3_5 },
                            { id: 'easy', label: t.age6_8 },
                            { id: 'medium', label: t.age9_11 },
                            { id: 'hard', label: t.age12_plus }
                          ].map((d) => (
                            <button
                              key={d.id}
                              onClick={() => {
                                SoundService.playClick();
                                const newDiffs = [...config.playerDifficulties];
                                newDiffs[i] = d.id as Difficulty;
                                setConfig(prev => ({ ...prev, playerDifficulties: newDiffs }));
                              }}
                              className={`py-1.5 px-0.5 rounded-lg text-[9px] font-black transition-all border-b-2 ${
                                config.playerDifficulties[i] === d.id
                                  ? 'bg-indigo-600 text-white border-indigo-800'
                                  : 'bg-white text-indigo-400 border-indigo-100 hover:bg-indigo-50'
                              }`}
                            >
                              {d.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            SoundService.playClick();
                            const newDevices = [...config.playerInputDevices];
                            newDevices[i] = { type: 'screen' };
                            setConfig(prev => ({ ...prev, playerInputDevices: newDevices }));
                          }}
                          className={`flex items-center justify-between px-5 py-3 rounded-2xl border-b-4 font-bold text-xs md:text-sm transition-all ${
                            config.playerInputDevices[i].type === 'screen'
                              ? 'bg-indigo-600 text-white border-indigo-800'
                              : 'bg-white text-indigo-400 border-indigo-100 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-center gap-3"><Monitor size={18} /> {t.controlType}</div>
                          {config.playerInputDevices[i].type === 'screen' && <Check size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            SoundService.playClick();
                            const newDevices = [...config.playerInputDevices];
                            const current = newDevices[i];
                            // Toggle between Profiles if already keyboard
                            if (current.type === 'keyboard') {
                              newDevices[i] = { type: 'keyboard', profile: current.profile === 'digits' ? 'numpad' : 'digits' };
                            } else {
                              newDevices[i] = { type: 'keyboard', profile: i === 0 ? 'digits' : 'numpad' };
                            }
                            setConfig(prev => ({ ...prev, playerInputDevices: newDevices }));
                          }}
                          className={`flex items-center justify-between px-5 py-3 rounded-2xl border-b-4 font-bold text-xs md:text-sm transition-all ${
                            config.playerInputDevices[i].type === 'keyboard'
                              ? 'bg-indigo-600 text-white border-indigo-800 ring-4 ring-white/20 shadow-xl'
                              : 'bg-white text-indigo-400 border-indigo-100 hover:bg-indigo-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Keyboard size={18} /> 
                            <span>
                                {config.playerInputDevices[i].type === 'keyboard' 
                                    ? `${t.keyboard}: ${(config.playerInputDevices[i] as any).profile === 'digits' ? t.keyboard : t.numpad}` 
                                    : t.keyboard}
                            </span>
                          </div>
                          {config.playerInputDevices[i].type === 'keyboard' && <Check size={16} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                SoundService.playClick();
                startGame();
              }}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-indigo-950 text-4xl font-black py-8 rounded-[40px] shadow-[0_12px_0_#ca8a04] hover:shadow-[0_6px_0_#ca8a04] hover:translate-y-1 transition-all flex items-center justify-center gap-6 mt-12 group uppercase"
            >
              <Play size={48} fill="currentColor" className="group-hover:scale-110 transition-transform" /> {t.startRace}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (gameStatus === 'WINNER') {
    return (
      <div className={`min-h-screen ${winner?.color} flex flex-col items-center justify-center p-6 text-white overflow-hidden`}>
        <motion.div
           initial={{ scale: 0, rotate: -10 }}
           animate={{ scale: 1, rotate: 0 }}
           transition={{ type: 'spring', bounce: 0.6 }}
           className="relative"
        >
          <Trophy size={160} className="text-yellow-300 drop-shadow-2xl" />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-10 -right-10 bg-white text-black p-6 rounded-full font-black text-3xl shadow-xl uppercase"
          >
            {t.victory}
          </motion.div>
        </motion.div>

        <div className="text-center mt-12 bg-black/20 p-12 rounded-[60px] backdrop-blur-md">
            <span className="text-8xl">{winner?.character}</span>
            <h2 className="text-7xl font-black mt-4 mb-2 tracking-tight drop-shadow-lg uppercase">
                {t.winner} {((winner?.id ?? 0) + 1)}
            </h2>
            <p className="text-2xl font-black opacity-80 uppercase tracking-[0.3em]">{t.champion}</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mt-8">
          <button
            onClick={() => {
                SoundService.playClick();
                setGameStatus('SETUP');
            }}
            className="bg-white/20 backdrop-blur-md text-white px-12 py-6 rounded-[30px] text-2xl font-black hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl border-b-4 border-black/20 uppercase"
          >
            <Home size={32} /> {t.home}
          </button>
          <button
            onClick={() => {
                SoundService.playClick();
                startGame();
            }}
            className="bg-white text-indigo-950 px-12 py-6 rounded-[30px] text-2xl font-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-xl border-b-4 border-indigo-200 uppercase"
          >
            <RotateCcw size={32} /> {t.playAgain}
          </button>
        </div>

        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: Math.random() * 100 + '%', y: '-10%', rotate: 0 }}
            animate={{ y: '110%', rotate: 360, x: (Math.random() * 100 - 50) + (i * 3) + '%' }}
            transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, ease: "linear" }}
            className="absolute text-5xl pointer-events-none opacity-40"
          >
            {['🎉', '✨', '🏆', '⭐', '🎈'][Math.floor(Math.random() * 5)]}
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-row bg-indigo-950 overflow-hidden relative pt-24 pb-8">
      <RaceTrack players={players} playerCount={config.playerCount} targetScore={config.targetScore} />

      <AnimatePresence>
        {gameStatus === 'PAUSED' && (
          <PauseMenu 
            t={t}
            onResume={() => setGameStatus('PLAYING')} 
            onMainMenu={() => setGameStatus('SETUP')} 
          />
        )}
      </AnimatePresence>

      <button 
        onClick={() => {
            SoundService.playClick();
            setGameStatus('PAUSED');
        }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] bg-white/20 hover:bg-white/30 backdrop-blur-xl p-6 rounded-full text-white shadow-2xl border border-white/20 transition-all hover:scale-110 group"
      >
        <Pause size={32} fill="currentColor" className="group-hover:animate-pulse" />
      </button>

      {players.map((player) => {
        const isCorrect = player.isCorrect === true;
        const isWrong = player.isCorrect === false;

        return (
          <div 
            key={player.id} 
            className={`
              relative flex flex-col flex-1
              ${player.color} transition-colors duration-300
              ${player.id < config.playerCount - 1 ? 'border-r border-indigo-900/20' : ''}
            `}
          >
            <div className="absolute top-6 left-6 flex items-center gap-4 z-10">
              <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-3 border border-white/10">
                <span className="text-4xl">{player.character}</span>
                <span className="text-white font-black text-2xl tracking-tighter uppercase">{t.winner} {player.id + 1}</span>
              </div>
              <div className="bg-black/30 backdrop-blur-xl px-6 py-3 rounded-full flex items-center gap-3 border border-white/10">
                <Trophy size={28} className="text-yellow-400" />
                <span className="text-white font-black text-2xl tracking-tighter">{player.score} <span className="text-white/40 text-sm">/ {config.targetScore}</span></span>
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={player.currentProblem.id}
                  initial={{ y: 40, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -40, opacity: 0, scale: 1.1 }}
                  className="text-center w-full max-w-lg"
                >
                  <div className="text-8xl md:text-[120px] font-black text-white tracking-tighter drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)] mb-12 leading-none">
                    {player.currentProblem.question}
                  </div>
                  
                  <motion.div 
                    animate={isWrong ? { x: [-15, 15, -15, 15, 0] } : (isCorrect ? { scale: [1, 1.3, 1] } : {})}
                    className={`
                        w-full h-32 bg-white rounded-[40px] flex items-center justify-center p-4 shadow-2xl border-b-[12px] border-black/10 transition-all cursor-pointer relative
                        ${isCorrect ? 'bg-emerald-100 text-emerald-600' : isWrong ? 'bg-rose-100 text-rose-600' : 'text-indigo-950'}
                        ${player.inputDevice.type !== 'screen' ? 'ring-8 ring-white/40 scale-[1.02] -translate-y-1' : ''}
                    `}
                  >
                    <div className="flex items-center justify-center relative">
                        <span className="text-7xl font-black">
                            {player.userInput === '' ? '?' : player.userInput}
                        </span>
                    </div>
                  </motion.div>
                </motion.div>
              </AnimatePresence>

              {player.inputDevice.type === 'screen' ? (
                <Numpad 
                    onPress={(v) => handleInput(player.id, v)}
                    onDelete={() => handleDelete(player.id)}
                    onConfirm={() => handleConfirm(player.id)}
                />
              ) : (
                <div className="mt-12 flex flex-col items-center">
                    <div className="bg-black/30 backdrop-blur-md p-10 rounded-[40px] border-2 border-white/20 shadow-2xl">
                        <div className="flex gap-4">
                             <Keyboard size={48} className="text-white/40" />
                             <div className="flex flex-col">
                                <span className="text-white/40 font-black text-2xl uppercase tracking-widest leading-none">Ready</span>
                                <span className="text-white/20 font-bold text-xs uppercase tracking-widest mt-1">
                                    {(player.inputDevice as any).name || 'Universal Keyboard'}
                                </span>
                             </div>
                        </div>
                    </div>
                    <div className="mt-6 text-white/60 font-black flex items-center gap-2 uppercase tracking-widest text-sm">
                        <ChevronRight size={16} /> Use your physical keys to solve! <ChevronLeft size={16} />
                    </div>
                </div>
              )}
            </div>

            <AnimatePresence>
                {isCorrect && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-emerald-500/30"
                    >
                        <div className="bg-white p-12 rounded-full shadow-2xl">
                            <Check size={120} className="text-emerald-500" />
                        </div>
                    </motion.div>
                )}
                {isWrong && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 bg-rose-500/30"
                    >
                         <div className="bg-white p-12 rounded-full shadow-2xl">
                            <CircleStop size={120} className="text-rose-500" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
        );
      })}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #6366f1; border-radius: 10px; }
        .dashed { background-image: linear-gradient(to bottom, #facc15 50%, transparent 50%); background-size: 1px 12px; background-repeat: repeat-y; }
      `}</style>
    </div>
  );
}
