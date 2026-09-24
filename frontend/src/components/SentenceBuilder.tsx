import React, { useState } from 'react';
import { Volume2, Copy, Delete, Space, RotateCcw, Check, Sparkles, Undo2, Hand, CheckCircle2 } from 'lucide-react';
import { speakText } from '../utils/speech';

interface SentenceBuilderProps {
  activeMode?: 'isl' | 'asl' | 'multilingual';
  // Common sentence
  sentence: string;
  onUpdateSentence: (newSentence: string) => void;
  // ISL specific
  islWords?: string[];
  onUpdateIslWords?: (words: string[]) => void;
  currentSign?: string;
  currentHindiName?: string;
  confidence?: number;
  isStable?: boolean;
  onSelectPracticeSign?: (sign: string) => void;
  // ASL specific
  activeLetter?: string;
  holdProgress?: number; // 0.0 to 1.0
  lastTypedChar?: string | null;
}

// 100% verified demo scenarios using ONLY genuine 61-class model vocabulary:
const VERIFIED_ISL_DEMO_SCENARIOS = [
  {
    title: 'Hospitality / Beverage',
    badge: '4 Signs',
    signs: ['Hello', 'Drink', 'Tea', 'Thank you'],
    description: 'Service greeting, ordering tea, and polite closure',
  },
  {
    title: 'Emergency Medical',
    badge: '4 Signs',
    signs: ['Hello', 'Fever', 'Injury', 'Come'],
    description: 'Urgent medical assistance request for illness and injury',
  },
  {
    title: 'Kitchen & Meal',
    badge: '4 Signs',
    signs: ['Clean', 'Vegetables', 'Cook', 'Thank you'],
    description: 'Food preparation and dining instruction',
  },
  {
    title: 'Heritage & Travel',
    badge: '4 Signs',
    signs: ['Good afternoon', 'Temple', 'Come', 'Thank you'],
    description: 'Greeting, visiting temple, and departure',
  },
  {
    title: 'Counter Identification',
    badge: '3 Signs',
    signs: ['Good Morning', 'What is your Name', 'Thank you'],
    description: 'Official service desk introduction and greeting',
  },
  {
    title: 'Utensil Request',
    badge: '4 Signs',
    signs: ['Give', 'Knife', 'Lemon', 'Thank you'],
    description: 'Simple dining / assistance exchange',
  },
];

// Curated supported demo signs for quick demonstration
const CURATED_DEMO_SIGNS = [
  { sign: 'Hello', hindi: 'नमस्ते', hands: '1 Hand', cat: 'Greeting' },
  { sign: 'Thank you', hindi: 'धन्यवाद', hands: '1 Hand', cat: 'Greeting' },
  { sign: 'Good Morning', hindi: 'सुप्रभात', hands: '2 Hands', cat: 'Greeting' },
  { sign: 'Good afternoon', hindi: 'शुभ दोपहर', hands: '2 Hands', cat: 'Greeting' },
  { sign: 'Drink', hindi: 'पीना', hands: '1 Hand', cat: 'Actions' },
  { sign: 'Tea', hindi: 'चाय', hands: '2 Hands', cat: 'Beverage' },
  { sign: 'Clean', hindi: 'साफ', hands: '2 Hands', cat: 'Actions' },
  { sign: 'Cook', hindi: 'पकाना', hands: '2 Hands', cat: 'Actions' },
  { sign: 'Vegetables', hindi: 'सब्जियां', hands: '2 Hands', cat: 'Food' },
  { sign: 'Fever', hindi: 'बुखार', hands: '1 Hand', cat: 'Medical' },
  { sign: 'Injury', hindi: 'चोट', hands: '1 Hand', cat: 'Medical' },
  { sign: 'Come', hindi: 'आओ', hands: '1 Hand', cat: 'Actions' },
  { sign: 'Give', hindi: 'देना', hands: '1 Hand', cat: 'Actions' },
  { sign: 'Temple', hindi: 'मंदिर', hands: '2 Hands', cat: 'Places' },
  { sign: 'Close', hindi: 'बंद', hands: '2 Hands', cat: 'Actions' },
  { sign: 'Switch', hindi: 'स्विच', hands: '1 Hand', cat: 'Objects' },
];

export const SentenceBuilder: React.FC<SentenceBuilderProps> = ({
  activeMode = 'isl',
  sentence,
  onUpdateSentence,
  islWords = [],
  onUpdateIslWords,
  currentSign,
  currentHindiName,
  confidence = 0,
  isStable = false,
  onSelectPracticeSign,
  activeLetter,
  holdProgress = 0,
  lastTypedChar,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // Computed ISL sentence text
  const islSentenceText = islWords.join(' ');
  const activeSentence = activeMode === 'isl' ? (islSentenceText || sentence) : sentence;

  const handleSpeak = () => {
    if (!activeSentence.trim()) return;
    speakText(activeSentence);
  };

  const handleCopy = () => {
    if (!activeSentence) return;
    navigator.clipboard.writeText(activeSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ISL word actions
  const handleUndoIslWord = () => {
    if (onUpdateIslWords && islWords.length > 0) {
      const next = islWords.slice(0, -1);
      onUpdateIslWords(next);
      onUpdateSentence(next.join(' '));
    } else if (sentence) {
      const parts = sentence.trim().split(/\s+/);
      const next = parts.slice(0, -1).join(' ');
      onUpdateSentence(next);
    }
  };

  const handleClearIslSentence = () => {
    if (onUpdateIslWords) onUpdateIslWords([]);
    onUpdateSentence('');
  };

  const handleApplyScenario = (scenarioSigns: string[]) => {
    if (onUpdateIslWords) {
      onUpdateIslWords(scenarioSigns);
    }
    const joined = scenarioSigns.join(' ');
    onUpdateSentence(joined);
    speakText(joined);
  };

  const handleSignChipClick = (sign: string) => {
    if (onSelectPracticeSign) {
      onSelectPracticeSign(sign);
    }
    if (onUpdateIslWords) {
      const next = [...islWords, sign];
      onUpdateIslWords(next);
      onUpdateSentence(next.join(' '));
    } else {
      const updated = sentence.trim() ? `${sentence.trim()} ${sign}` : sign;
      onUpdateSentence(updated);
    }
  };

  // ASL specific handlers
  const handleBackspace = () => {
    onUpdateSentence(sentence.slice(0, -1));
  };

  const handleSpace = () => {
    onUpdateSentence(sentence + ' ');
  };

  const handleClear = () => {
    onUpdateSentence('');
  };

  // ----------------------------------------------------
  // ISL MODE VIEW
  // ----------------------------------------------------
  if (activeMode === 'isl') {
    return (
      <div className="flex flex-col bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-[#0B0F1A] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-100 tracking-wide flex items-center gap-2">
              <span>ISL Gesture Sentence Studio & Demo Builder</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                61-Class Live Model
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {currentSign && currentSign !== 'NO_HAND' && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">Live:</span>
                <strong className="text-emerald-300">{currentSign}</strong>
                {currentHindiName && <span className="text-emerald-400/80 text-[10px]">({currentHindiName})</span>}
                {isStable && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span className="text-slate-500 text-[10px]">{Math.round(confidence * 100)}%</span>
              </div>
            )}
            <span className="text-xs font-mono text-slate-500">
              {islWords.length} {islWords.length === 1 ? 'sign' : 'signs'}
            </span>
          </div>
        </div>

        {/* Live Sequence & Sentence Box */}
        <div className="p-5 flex flex-col gap-4">
          {/* Recent Words Sequence Chips */}
          {islWords.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[11px] text-slate-500 font-medium shrink-0 mr-1">Sequence:</span>
              {islWords.map((word, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-600 text-xs shrink-0">→</span>}
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-200 text-xs font-semibold shrink-0 shadow-sm">
                    {word}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Main Sentence Output Display */}
          <div className="relative min-h-[110px] max-h-[150px] p-4 bg-[#090D17] border border-slate-800 rounded-xl overflow-y-auto font-sans focus-within:border-emerald-500/60 transition-colors">
            {activeSentence ? (
              <div className="text-lg md:text-xl font-medium text-slate-100 tracking-normal break-words leading-relaxed">
                {activeSentence}
                <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 translate-y-0.5 animate-pulse" />
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-4">
                <Sparkles className="w-6 h-6 text-slate-600 mb-1.5" />
                <p className="text-xs md:text-sm font-medium text-slate-400">
                  Perform any supported ISL sign in front of the camera to build a live sentence
                </p>
                <p className="text-[11px] text-slate-600 mt-1 max-w-md">
                  Example: Sign <span className="text-emerald-400 font-semibold">Hello</span> → <span className="text-emerald-400 font-semibold">Drink</span> → <span className="text-emerald-400 font-semibold">Tea</span> → <span className="text-emerald-400 font-semibold">Thank you</span>
                </p>
              </div>
            )}
          </div>

          {/* Action Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSpeak}
                disabled={!activeSentence.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition active:scale-95"
              >
                <Volume2 className="w-4 h-4" /> Speak Full Sentence
              </button>

              <button
                onClick={handleCopy}
                disabled={!activeSentence}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleUndoIslWord}
                disabled={!activeSentence}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-amber-300 rounded-xl text-xs font-medium border border-slate-700 transition"
                title="Undo last sign"
              >
                <Undo2 className="w-4 h-4" /> Undo Sign
              </button>

              <button
                onClick={handleClearIslSentence}
                disabled={!activeSentence}
                className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded-xl text-xs font-medium border border-slate-700 transition"
                title="Clear sentence"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>

          {/* Verified Demo Preset Scenarios (100% genuine model vocabulary) */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium flex items-center gap-1.5 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Verified Judge Demo Scenarios:
              </span>
              <span className="text-[11px] text-slate-500">Composed strictly of 61-class trained signs</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {VERIFIED_ISL_DEMO_SCENARIOS.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyScenario(sc.signs)}
                  className="p-2.5 rounded-xl bg-slate-800/70 hover:bg-emerald-950/40 border border-slate-700/60 hover:border-emerald-600/50 text-left transition flex flex-col justify-between group active:scale-95"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200 group-hover:text-emerald-300">
                      {sc.title}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400">
                      {sc.badge}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 flex-wrap">
                    {sc.signs.map((s, sIdx) => (
                      <span key={sIdx} className="bg-slate-900/90 px-1 rounded text-slate-300">
                        {s}{sIdx < sc.signs.length - 1 ? ' →' : ''}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Supported Demo Cheat Sheet Palette */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-medium flex items-center gap-1 text-slate-300">
                <Hand className="w-3.5 h-3.5 text-indigo-400" /> Demo Quick Palette (Sign in Camera or Tap):
              </span>
              <span className="text-[11px] text-slate-500">16 high-confidence demo signs</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CURATED_DEMO_SIGNS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSignChipClick(item.sign)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-indigo-950/60 hover:border-indigo-700/60 border border-slate-700/70 text-xs font-medium text-slate-300 hover:text-indigo-200 transition active:scale-95 flex items-center gap-1.5"
                  title={`${item.hindi} (${item.hands}, ${item.cat})`}
                >
                  <span>{item.sign}</span>
                  <span className="text-[10px] text-emerald-400/80 font-normal">{item.hindi}</span>
                  <span className="text-[9px] px-1 rounded bg-slate-900 text-slate-400">{item.hands}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ASL CONTINUOUS TYPIST VIEW (PRESERVED)
  // ----------------------------------------------------
  return (
    <div className="flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-[#0B0F1A] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            ASL Continuous Typist & Sentence Studio
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {activeLetter && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-xs font-mono text-indigo-300">
              <span>Sign:</span>
              <strong className="text-indigo-200 text-sm">{activeLetter}</strong>
              <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden ml-1">
                <div
                  className="h-full bg-indigo-400 transition-all duration-75"
                  style={{ width: `${Math.round(holdProgress * 100)}%` }}
                />
              </div>
            </div>
          )}
          <span className="text-xs font-mono text-slate-500">
            {sentence.length} {sentence.length === 1 ? 'char' : 'chars'}
          </span>
        </div>
      </div>

      {/* Main Typed Sentence Display */}
      <div className="p-5 flex flex-col gap-4">
        <div className="relative min-h-[140px] max-h-[180px] p-4 bg-[#090D17] border border-slate-800 rounded-xl overflow-y-auto font-sans focus-within:border-indigo-500/60 transition-colors">
          {sentence ? (
            <div className="text-xl md:text-2xl font-medium text-slate-100 tracking-normal break-words leading-relaxed">
              {sentence}
              <span className="inline-block w-2 h-5 bg-indigo-400 ml-1 translate-y-0.5 animate-pulse" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-6">
              <Sparkles className="w-7 h-7 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-400">Your sentence will type here in real time</p>
              <p className="text-xs text-slate-600 mt-1 max-w-sm">
                Hold any ASL alphabet sign (A–Z) for ~0.2s to commit. Sign "SPACE" to separate words or "DEL" to backspace.
              </p>
            </div>
          )}

          {lastTypedChar && (
            <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 animate-fade-in">
              Committed: {lastTypedChar === ' ' ? '␣ SPACE' : lastTypedChar}
            </div>
          )}
        </div>

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeak}
              disabled={!sentence.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition active:scale-95"
            >
              <Volume2 className="w-4 h-4" /> Speak Full Sentence
            </button>

            <button
              onClick={handleCopy}
              disabled={!sentence}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleSpace}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Add space"
            >
              <Space className="w-4 h-4" /> Space
            </button>

            <button
              onClick={handleBackspace}
              disabled={!sentence}
              className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-rose-300 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Backspace"
            >
              <Delete className="w-4 h-4" /> Del
            </button>

            <button
              onClick={handleClear}
              disabled={!sentence}
              className="flex items-center gap-1 px-2.5 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 disabled:opacity-30 rounded-xl text-xs font-medium border border-slate-700 transition"
              title="Clear text"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
