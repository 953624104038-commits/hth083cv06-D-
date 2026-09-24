import React, { useState } from 'react';
import { Keyboard, CheckCircle2 } from 'lucide-react';

interface ASLKeyboardGuideProps {
  activeLetter?: string;
  onSelectLetter?: (char: string) => void;
}

const ASL_ALPHABET_DATA: Record<string, string> = {
  A: 'Fist with thumb upright beside index finger',
  B: 'Four fingers upright together, thumb folded flat over palm',
  C: 'Curved hand forming a C-shape',
  D: 'Index finger straight up, other three fingers touching thumb',
  E: 'All fingers curled tightly resting on thumb',
  F: 'Index fingertip touches thumb forming circle, 3 fingers up',
  G: 'Index and thumb pointing forward horizontally in parallel',
  H: 'Index and middle fingers extended together forward',
  I: 'Pinky pointing straight up, other fingers curled in fist',
  J: 'Pinky traces a J-curve in the air',
  K: 'Index finger up, middle finger forward, thumb between them',
  L: 'Index finger up, thumb out forming an L-shape',
  M: 'Fist with thumb tucked under first 3 fingers',
  N: 'Fist with thumb tucked under first 2 fingers',
  O: 'All fingertips touching thumb tip forming O-shape',
  P: 'Like K pointing downward toward floor',
  Q: 'Like G pointing downward toward floor',
  R: 'Index and middle fingers crossed over each other',
  S: 'Fist with thumb crossed horizontally over fingers',
  T: 'Fist with thumb tucked between index and middle fingers',
  U: 'Index and middle fingers held together straight up',
  V: 'Index and middle fingers held in a V-shape',
  W: 'Index, middle, and ring fingers spread up like a W',
  X: 'Fist with index finger bent into a hook shape',
  Y: 'Thumb and pinky extended out like a phone receiver',
  Z: 'Index finger traces a Z in the air',
  SPACE: 'Open 5-finger spread palm ("High-Five") OR flat horizontal hand — inserts a space',
  DEL: 'Fist flicking back, deletes previous character'
};

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
  ['SPACE']
];

export const ASLKeyboardGuide: React.FC<ASLKeyboardGuideProps> = ({
  activeLetter,
  onSelectLetter,
}) => {
  const [selectedChar, setSelectedChar] = useState<string>('A');

  const normalizedActive = activeLetter?.toUpperCase();
  const displayedChar = normalizedActive && ASL_ALPHABET_DATA[normalizedActive] ? normalizedActive : selectedChar;

  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="px-5 py-3.5 bg-[#0B0F1A] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            ASL Virtual Fingerspelling Keyboard
          </h3>
        </div>
        <span className="text-[11px] text-slate-500">Live tracker & Pose visualizer</span>
      </div>

      {/* Selected Letter Tip Banner */}
      <div className="px-5 py-3 bg-indigo-950/20 border-b border-indigo-900/30 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center font-bold text-lg text-indigo-300">
            {displayedChar}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Sign Shape: {displayedChar}
            </div>
            <div className="text-[11px] text-slate-400">
              {ASL_ALPHABET_DATA[displayedChar] || 'Hand formation shape'}
            </div>
          </div>
        </div>
        {normalizedActive === displayedChar && (
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Detected Live
          </div>
        )}
      </div>

      {/* Interactive Keycap Grid */}
      <div className="p-4 flex flex-col items-center gap-1.5 bg-[#090D17]">
        {KEYBOARD_ROWS.map((row, rIdx) => (
          <div key={rIdx} className="flex items-center gap-1.5 justify-center w-full">
            {row.map((key) => {
              const isActive = normalizedActive === key;
              const isSelected = selectedChar === key;
              const isAction = key === 'SPACE' || key === 'DEL';

              return (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedChar(key);
                    if (onSelectLetter) onSelectLetter(key);
                  }}
                  className={`relative font-mono font-semibold rounded-lg transition-all active:scale-95 ${
                    isAction ? 'px-4 py-2 text-xs' : 'w-8 h-9 text-xs'
                  } ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-950/60 scale-110 z-10 font-bold border-2 border-white'
                      : isSelected
                      ? 'bg-slate-700 text-indigo-200 border border-indigo-500/60'
                      : 'bg-slate-800/90 hover:bg-slate-700/80 text-slate-300 border border-slate-700/60'
                  }`}
                  title={`${key}: ${ASL_ALPHABET_DATA[key] || ''}`}
                >
                  {key}
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
