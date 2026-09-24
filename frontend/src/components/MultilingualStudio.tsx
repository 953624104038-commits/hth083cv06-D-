import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Copy, Check, Plus, Trash2, ArrowRight, Zap, Search, Sparkles, Globe2 } from 'lucide-react';
import { speakInLanguage } from '../utils/speech';

interface MultilingualStudioProps {
  currentDetectedSign?: string;
  isStableEvent?: boolean;
  onOpenAIKey?: () => void;
}

interface TranslationData {
  concepts: string[];
  sentence: string;
  translations: Record<string, string>;
  source?: string;
}

const LANGUAGES = [
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', flag: '🇮🇳' },
  { code: 'en', name: 'English', native: 'English', flag: '🌐' }
];

const PRESET_SIGN_SEQUENCES = [
  { label: 'Single "I"', concepts: ['I'] },
  { label: 'I + Fever', concepts: ['I', 'Fever'] },
  { label: 'Need + Doctor', concepts: ['Need', 'Doctor'] },
  { label: 'Water + Drink', concepts: ['Water', 'Drink'] },
  { label: 'Help + Please', concepts: ['Help', 'Please'] },
  { label: 'Where + Hospital', concepts: ['Where', 'Hospital'] },
  { label: 'Thank you', concepts: ['Thank you'] },
  { label: 'Good morning', concepts: ['Good morning'] },
];

const QUICK_ISL_SIGNS = [
  'I', 'Fever', 'Doctor', 'Help', 'Water', 'Drink', 'Please', 'Need', 'Hospital', 'Where',
  'Break', 'Clean', 'Close', 'Come', 'Cook', 'Cry', 'Exam', 'Fedup', 'Give', 'Hello',
  'Injury', 'Tea', 'Temple', 'Thank you', 'Umbrella', 'Vegetables', 'Wrong', 'Bear', 'Elephant'
];

export const MultilingualStudio: React.FC<MultilingualStudioProps> = ({
  currentDetectedSign,
  isStableEvent = false,
}) => {
  const [concepts, setConcepts] = useState<string[]>([]);
  const [newConceptInput, setNewConceptInput] = useState<string>('');
  const [data, setData] = useState<TranslationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedLang, setSelectedLang] = useState<string>('ta');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [autoAddCamera, setAutoAddCamera] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [showSignTray, setShowSignTray] = useState<boolean>(false);

  const lastAddedSignRef = useRef<string | null>(null);
  const lastAddedTimestampRef = useRef<number>(0);

  const isInvalidSign = (s?: string) => {
    if (!s) return true;
    const l = s.toLowerCase().trim();
    const blocked = ['no hand', 'unclear', 'none', '', 'turtle', 'bear', 'crocodile', 'giraffe', 'monkey', 'volcano', 'radish'];
    return blocked.some(b => l === b || l.includes('no hand') || l.includes('unclear'));
  };

  // Handle auto-adding camera detected signs with strict 2.2s cooldown & anti-alternation guard
  useEffect(() => {
    if (!autoAddCamera || !isStableEvent || isInvalidSign(currentDetectedSign)) return;

    const now = Date.now();
    if (now - lastAddedTimestampRef.current < 2200) return;
    if (lastAddedSignRef.current === currentDetectedSign) return;

    lastAddedSignRef.current = currentDetectedSign!;
    lastAddedTimestampRef.current = now;

    setConcepts(prev => {
      if (prev.length >= 8) return prev; // Keep buffer concise unless cleared
      if (prev.length > 0 && prev[prev.length - 1].toLowerCase() === currentDetectedSign!.toLowerCase()) {
        return prev;
      }
      return [...prev, currentDetectedSign!];
    });
  }, [currentDetectedSign, isStableEvent, autoAddCamera]);

  // Trigger sentence formation and multilingual translation
  const processConcepts = async (conceptList: string[]) => {
    if (!conceptList || conceptList.length === 0) {
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/form-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concepts: conceptList })
      });
      const result: TranslationData = await res.json();
      setData(result);
    } catch (e) {
      console.error('Error forming sentence:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    processConcepts(concepts);
  }, [concepts]);

  const handleAddConcept = (c: string) => {
    const trimmed = c.trim();
    if (!trimmed) return;
    setConcepts(prev => [...prev, trimmed]);
    setNewConceptInput('');
  };

  const handleRemoveConcept = (index: number) => {
    setConcepts(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAll = () => {
    setConcepts([]);
    setData(null);
  };

  const handleSpeak = (text: string, langCode: string) => {
    if (!text) return;
    speakInLanguage(text, langCode);
  };

  const handleCopy = (text: string, code: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  const filteredQuickSigns = QUICK_ISL_SIGNS.filter(s =>
    s.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="flex flex-col bg-[#0E1322] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Studio Header Bar */}
      <div className="px-6 py-4 bg-[#0B0F1A] border-b border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold shadow-md shadow-indigo-950/40">
            <Globe2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Multilingual AI Communication Bridge
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 font-mono font-semibold uppercase">
                4-Stage Pipeline
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Isolated Signs → Contextual Sentence → 6 Languages → Regional Speech
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-800/60 text-[11px] font-mono text-emerald-300 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Cloud Neural AI Engine
          </span>
        </div>
      </div>

      {/* Studio Body */}
      <div className="p-5 sm:p-6 flex flex-col gap-5">

        {/* ========================================================
            STAGE 1: Sign Concept Stream (Accumulator)
            ======================================================== */}
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 inline-flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              <span>Stage 1: Recognized Sign Concepts Sequence</span>
            </label>

            <div className="flex items-center gap-3">
              {/* Auto-add Camera Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none">
                <input
                  type="checkbox"
                  checked={autoAddCamera}
                  onChange={e => setAutoAddCamera(e.target.checked)}
                  className="rounded bg-slate-850 border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
                />
                <span className="flex items-center gap-1 font-medium">
                  <Zap className={`w-3 h-3 ${autoAddCamera ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                  Auto-Add Camera Signs
                </span>
              </label>

              {concepts.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All
                </button>
              )}
            </div>
          </div>

          {/* Tokens Accumulation Box */}
          <div className="min-h-[56px] p-2.5 rounded-xl bg-[#090D17] border border-slate-800/90 flex flex-wrap items-center gap-2">
            {concepts.length === 0 ? (
              <div className="text-xs text-slate-500 italic px-2 flex items-center gap-1.5">
                <span>Awaiting gestures.</span>
                <span className="text-slate-600">
                  (Perform signs before camera, click presets below, or browse 61 ISL vocabulary)
                </span>
              </div>
            ) : (
              concepts.map((concept, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-xs font-semibold text-white shadow-sm animate-fade-in"
                >
                  <span>🖐️</span>
                  <span>{concept}</span>
                  <button
                    onClick={() => handleRemoveConcept(idx)}
                    className="w-4 h-4 rounded-md hover:bg-slate-750 text-slate-400 hover:text-rose-300 inline-flex items-center justify-center text-xs ml-1 transition"
                  >
                    ×
                  </button>
                </div>
              ))
            )}

            {/* Manual input for custom concept */}
            <form
              onSubmit={(e) => { e.preventDefault(); handleAddConcept(newConceptInput); }}
              className="inline-flex items-center ml-auto"
            >
              <input
                type="text"
                placeholder="+ Add sign..."
                value={newConceptInput}
                onChange={(e) => setNewConceptInput(e.target.value)}
                className="w-28 px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
              />
            </form>
          </div>

          {/* Presets & Active Camera Detection Indicator */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            <span className="text-[11px] text-slate-500 font-medium mr-1">Presets:</span>
            {PRESET_SIGN_SEQUENCES.map((preset, pIdx) => (
              <button
                key={pIdx}
                onClick={() => setConcepts(preset.concepts)}
                className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-700/60 text-[11px] font-medium text-slate-300 hover:text-indigo-200 transition active:scale-95"
              >
                {preset.label}
              </button>
            ))}

            {/* Camera Live detected button */}
            {!isInvalidSign(currentDetectedSign) && currentDetectedSign && (
              <button
                onClick={() => handleAddConcept(currentDetectedSign)}
                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-700/80 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/80 transition active:scale-95 flex items-center gap-1 ml-auto"
              >
                <Plus className="w-3 h-3" /> Append Detected: "{currentDetectedSign}"
              </button>
            )}

            <button
              onClick={() => setShowSignTray(!showSignTray)}
              className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-700 text-[11px] font-medium text-slate-300 transition"
            >
              {showSignTray ? '▲ Hide 61 Signs' : '▼ Browse 61 ISL Signs'}
            </button>
          </div>

          {/* Collapsible 61 Signs Tray */}
          {showSignTray && (
            <div className="p-3 bg-[#090D17] border border-slate-800 rounded-xl space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-800">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search 61 signs (e.g. Fever, Doctor, Help, Water, Clean)..."
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {filteredQuickSigns.map(sign => (
                  <button
                    key={sign}
                    onClick={() => handleAddConcept(sign)}
                    className="px-2.5 py-1 rounded-md bg-slate-850 hover:bg-indigo-900/40 border border-slate-750 hover:border-indigo-600 text-[11px] text-slate-300 hover:text-white transition flex items-center gap-1 active:scale-95"
                  >
                    <span>+</span>
                    <span>{sign}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transition Arrow */}
        <div className="flex items-center justify-center -my-2 text-slate-700">
          <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0 text-indigo-400" />
        </div>

        {/* ========================================================
            STAGE 2: AI Synthesized Natural Sentence (English)
            ======================================================== */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 inline-flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              <span>Stage 2: AI Synthesized Natural Sentence (English)</span>
            </label>
            {loading && (
              <span className="text-xs text-indigo-400 animate-pulse font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 animate-spin" /> Synthesizing sentence...
              </span>
            )}
          </div>

          <div className="p-4 bg-[#090D17] border border-indigo-500/30 rounded-xl flex items-center justify-between gap-4 shadow-lg">
            <div className="text-lg md:text-xl font-bold text-white tracking-normal leading-relaxed">
              {data?.sentence || (
                concepts.length === 0
                  ? <span className="text-slate-500 font-normal italic text-sm">Awaiting sign concepts to form sentence...</span>
                  : (loading ? 'Synthesizing grammatical sentence...' : '—')
              )}
            </div>

            {data?.sentence && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleSpeak(data.sentence, 'en')}
                  className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition active:scale-95"
                  title="Speak English"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Speak
                </button>
                <button
                  onClick={() => handleCopy(data.sentence, 'en')}
                  className="p-2 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-lg border border-slate-700 transition active:scale-95"
                  title="Copy English"
                >
                  {copiedCode === 'en' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            STAGES 3 & 4: Multilingual Translation Grid & Voice Output
            ======================================================== */}
        <div className="flex flex-col gap-3 pt-3 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800/80 inline-flex items-center justify-center text-[11px] font-bold">
                3 & 4
              </span>
              <span>Stages 3 & 4: Multilingual Translations & Regional Voice (TTS)</span>
            </label>
            <span className="text-[11px] text-slate-400">
              One-click native voice synthesis in regional accents
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {LANGUAGES.map((lang) => {
              const translation = data?.translations?.[lang.code] || '';
              const isSelected = selectedLang === lang.code;

              return (
                <div
                  key={lang.code}
                  className={`p-4 rounded-xl transition-all duration-200 flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-[#090D17] border-indigo-500/80 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/40'
                      : 'bg-[#090D17]/80 border-slate-800 hover:border-slate-750'
                  }`}
                  onClick={() => setSelectedLang(lang.code)}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/70">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span className="text-xs font-bold text-white">{lang.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          ({lang.native})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">{lang.code}</span>
                    </div>

                    <div className="text-sm font-medium text-slate-200 min-h-[46px] flex items-center leading-relaxed">
                      {translation || (
                        concepts.length === 0
                          ? <span className="text-slate-600 italic text-xs">Ready for signs</span>
                          : (loading ? 'Translating...' : '—')
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2.5 mt-2 border-t border-slate-800/60">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSpeak(translation, lang.code); }}
                      disabled={!translation}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                    >
                      <Volume2 className="w-3.5 h-3.5" /> Speak
                    </button>

                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(translation, lang.code); }}
                      disabled={!translation}
                      className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-750 disabled:opacity-30 text-slate-400 hover:text-white border border-slate-800 transition"
                      title={`Copy ${lang.name}`}
                    >
                      {copiedCode === lang.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
