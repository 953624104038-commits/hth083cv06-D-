import React, { useState } from 'react';
import {
  X,
  BookOpen,
  ExternalLink,
  ShieldCheck,
  Search,
  Sparkles,
  ArrowRight,
  Plus,
  RotateCcw,
  Play,
  Layers,
  ImageOff
} from 'lucide-react';
import type { SignClass, AppMode } from '../types';
import { Hand3DViewer } from './hand3d/Hand3DViewer';
import { Sequence3DModal } from './hand3d/Sequence3DModal';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: SignClass[];
  activeMode: AppMode;
  onSelectPracticeSign?: (sign: string) => void;
  onSelectTargetSentence?: (sequence: string[]) => void;
}

// Visual reference card definitions (lazy loaded SVGs with fallback placeholder)
interface VisualCardItem {
  id: string;
  name: string;
  hindiName: string;
  imgSrc: string;
  description: string;
  hands: '1 Hand' | '2 Hands';
  motion: 'Static' | 'Dynamic';
}

const QUICK_LEARN_VISUAL_SIGNS: VisualCardItem[] = [
  {
    id: 'Hello',
    name: 'HELLO',
    hindiName: 'नमस्ते',
    imgSrc: '/gestures/hello.svg',
    description: 'Palm facing outward, gentle greeting movement.',
    hands: '1 Hand',
    motion: 'Dynamic',
  },
  {
    id: 'Help',
    name: 'HELP',
    hindiName: 'मदद',
    imgSrc: '/gestures/help.svg',
    description: 'Show the required hand position and upward movement.',
    hands: '2 Hands',
    motion: 'Dynamic',
  },
  {
    id: 'Need',
    name: 'NEED',
    hindiName: 'ज़रूरत / चाहिए',
    imgSrc: '/gestures/need.svg',
    description: 'Clearly show the correct hand position and movement.',
    hands: '1 Hand',
    motion: 'Dynamic',
  },
  {
    id: 'Thank you',
    name: 'THANK YOU',
    hindiName: 'धन्यवाद',
    imgSrc: '/gestures/thank_you.svg',
    description: 'Clearly show the hand position and movement.',
    hands: '1 Hand',
    motion: 'Dynamic',
  },
];

// Pre-configured verified demo combinations
interface DemoCombination {
  title: string;
  signs: string[];
  description: string;
  category: string;
  badge?: string;
}

const PRESET_DEMO_COMBINATIONS: DemoCombination[] = [
  {
    title: 'Primary Emergency Assistance Demo',
    signs: ['Hello', 'Need', 'Help'],
    description: 'Polite greeting followed by urgent request for assistance.',
    category: 'Emergency',
    badge: 'Primary Demo',
  },
  {
    title: 'Polite Service Exchange',
    signs: ['Hello', 'Thank you'],
    description: 'Standard polite counter greeting and appreciation.',
    category: 'Greetings',
  },
  {
    title: 'Medical Injury Alert',
    signs: ['Injury', 'Help'],
    description: 'Immediate alert indicating injury and requesting aid.',
    category: 'Medical',
  },
  {
    title: 'Hospitality & Beverage',
    signs: ['Drink', 'Tea', 'Thank you'],
    description: 'Ordering beverage at a hospitality or dining counter.',
    category: 'Daily Living',
  },
  {
    title: 'Kitchen & Meal Instruction',
    signs: ['Clean', 'Vegetables', 'Cook'],
    description: 'Kitchen assistance sequence for cleaning and cooking vegetables.',
    category: 'Daily Living',
  },
  {
    title: 'Service Counter Introduction',
    signs: ['Good Morning', 'What is your Name'],
    description: 'Official service desk introduction and greeting.',
    category: 'Greetings',
  },
];

// Map 61 class to hand-count & motion type based on official ISLRTC standards:
const ISL_METADATA_MAP: Record<string, { hands: 1 | 2; motion: 'static' | 'dynamic'; group: string }> = {
  'Bear': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Break': { hands: 2, motion: 'dynamic', group: 'Actions' },
  'Brinjal': { hands: 2, motion: 'dynamic', group: 'Food' },
  'Budget': { hands: 2, motion: 'dynamic', group: 'Finance' },
  'Busy': { hands: 2, motion: 'dynamic', group: 'Daily' },
  'Cabbage': { hands: 2, motion: 'dynamic', group: 'Food' },
  'Carrot': { hands: 1, motion: 'dynamic', group: 'Food' },
  'Cauliflower': { hands: 2, motion: 'dynamic', group: 'Food' },
  'Chilli': { hands: 1, motion: 'dynamic', group: 'Food' },
  'Clean': { hands: 2, motion: 'dynamic', group: 'Actions' },
  'Close': { hands: 2, motion: 'dynamic', group: 'Actions' },
  'Come': { hands: 1, motion: 'dynamic', group: 'Actions' },
  'Cook': { hands: 2, motion: 'dynamic', group: 'Actions' },
  'Crocodile': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Cry': { hands: 2, motion: 'dynamic', group: 'Emotions' },
  'Cucumber': { hands: 2, motion: 'dynamic', group: 'Food' },
  'Deer': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Drink': { hands: 1, motion: 'dynamic', group: 'Actions' },
  'Elephant': { hands: 1, motion: 'dynamic', group: 'Animals' },
  'Exam': { hands: 2, motion: 'dynamic', group: 'Education' },
  'Fedup': { hands: 1, motion: 'static', group: 'Emotions' },
  'Fever': { hands: 1, motion: 'static', group: 'Healthcare' },
  'Giraffe': { hands: 1, motion: 'dynamic', group: 'Animals' },
  'Give': { hands: 1, motion: 'dynamic', group: 'Actions' },
  'Good Morning': { hands: 2, motion: 'dynamic', group: 'Greetings' },
  'Good afternoon': { hands: 2, motion: 'dynamic', group: 'Greetings' },
  'Hello': { hands: 1, motion: 'dynamic', group: 'Greetings' },
  'Hug': { hands: 2, motion: 'dynamic', group: 'Emotions' },
  'Injury': { hands: 1, motion: 'static', group: 'Healthcare' },
  'Interview': { hands: 2, motion: 'dynamic', group: 'Work' },
  'Jump': { hands: 2, motion: 'dynamic', group: 'Actions' },
  'Karnataka': { hands: 2, motion: 'dynamic', group: 'Places' },
  'Key': { hands: 2, motion: 'dynamic', group: 'Objects' },
  'Knife': { hands: 2, motion: 'dynamic', group: 'Objects' },
  'Lemon': { hands: 1, motion: 'dynamic', group: 'Food' },
  'Lion': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Man': { hands: 1, motion: 'static', group: 'People' },
  'Maths': { hands: 2, motion: 'dynamic', group: 'Education' },
  'Maybe': { hands: 2, motion: 'dynamic', group: 'General' },
  'Monkey': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Onion': { hands: 1, motion: 'dynamic', group: 'Food' },
  'Peacock': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Pigeon': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Pour': { hands: 1, motion: 'dynamic', group: 'Actions' },
  'Radish': { hands: 1, motion: 'dynamic', group: 'Food' },
  'Sparrow': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Still': { hands: 2, motion: 'static', group: 'General' },
  'Switch': { hands: 1, motion: 'dynamic', group: 'Objects' },
  'Tea': { hands: 2, motion: 'dynamic', group: 'Food' },
  'Temple': { hands: 2, motion: 'static', group: 'Places' },
  'Thank you': { hands: 1, motion: 'dynamic', group: 'Greetings' },
  'Tiger': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Turtle': { hands: 2, motion: 'dynamic', group: 'Animals' },
  'Umbrella': { hands: 2, motion: 'dynamic', group: 'Objects' },
  'Uncle': { hands: 1, motion: 'dynamic', group: 'People' },
  'Vegetables': { hands: 2, motion: 'dynamic', group: 'Food' },
  'Volcano': { hands: 2, motion: 'dynamic', group: 'Nature' },
  'What is your Name': { hands: 2, motion: 'dynamic', group: 'Greetings' },
  'Wife': { hands: 2, motion: 'dynamic', group: 'People' },
  'Writer': { hands: 2, motion: 'dynamic', group: 'Work' },
  'Wrong': { hands: 1, motion: 'static', group: 'General' },
};

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeMode,
  onSelectPracticeSign,
  onSelectTargetSentence,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedFilter, setSelectedFilter] = useState<string>('All');
  const [handFilter, setHandFilter] = useState<'All' | '1 Hand' | '2 Hands'>('All');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Interactive Custom Sentence Builder State
  const [customSequence, setCustomSequence] = useState<string[]>([]);
  const [selectedAddSign, setSelectedAddSign] = useState<string>('Hello');

  // 3D Demonstrations & Sequence State
  const [active3DSequence, setActive3DSequence] = useState<string[] | null>(null);
  const [viewMode3D, setViewMode3D] = useState<Record<string, boolean>>({
    Hello: true,
    Help: true,
    Need: true,
    'Thank you': true,
  });

  if (!isOpen) return null;

  const quickFilterTabs = [
    'All',
    'Greetings & Service',
    'Healthcare & Emergency',
    'Food & Kitchen',
    'Actions & Daily',
    'Animals & Nature',
    'Objects & Places',
  ];

  const filteredClasses = classes.filter(cls => {
    const meta = ISL_METADATA_MAP[cls.label] || { hands: 1, motion: 'dynamic', group: 'General' };

    const matchesSearch =
      (cls.label && cls.label.toLowerCase().includes(search.toLowerCase())) ||
      (cls.display_name && cls.display_name.toLowerCase().includes(search.toLowerCase())) ||
      (cls.hindi_name && cls.hindi_name.includes(search)) ||
      (cls.category && cls.category.toLowerCase().includes(search.toLowerCase())) ||
      (cls.how_to_perform && cls.how_to_perform.toLowerCase().includes(search.toLowerCase()));

    // Hand Filter
    const matchesHand =
      handFilter === 'All' ||
      (handFilter === '1 Hand' && meta.hands === 1) ||
      (handFilter === '2 Hands' && meta.hands === 2);

    // Group Filter
    let matchesGroup = true;
    if (selectedFilter === 'Greetings & Service') {
      matchesGroup = ['Greetings', 'Finance', 'Work'].includes(meta.group) || cls.category === 'Greetings';
    } else if (selectedFilter === 'Healthcare & Emergency') {
      matchesGroup = ['Healthcare', 'Emotions'].includes(meta.group) || cls.category === 'Emergency & Medical';
    } else if (selectedFilter === 'Food & Kitchen') {
      matchesGroup = meta.group === 'Food' || cls.category === 'Food & Groceries';
    } else if (selectedFilter === 'Actions & Daily') {
      matchesGroup = ['Actions', 'Daily', 'General'].includes(meta.group);
    } else if (selectedFilter === 'Animals & Nature') {
      matchesGroup = ['Animals', 'Nature'].includes(meta.group);
    } else if (selectedFilter === 'Objects & Places') {
      matchesGroup = ['Objects', 'Places', 'Education', 'People'].includes(meta.group);
    }

    return matchesSearch && matchesHand && matchesGroup;
  });

  const handlePracticeSign = (signLabel: string) => {
    if (onSelectPracticeSign) {
      onSelectPracticeSign(signLabel);
    }
    onClose();
  };

  const handleTrySentence = (sequence: string[]) => {
    if (onSelectTargetSentence) {
      onSelectTargetSentence(sequence);
    } else if (onSelectPracticeSign && sequence.length > 0) {
      onSelectPracticeSign(sequence[0]);
    }
    onClose();
  };

  const handleAddCustomSign = () => {
    if (selectedAddSign && !customSequence.includes(selectedAddSign)) {
      setCustomSequence([...customSequence, selectedAddSign]);
    }
  };

  const handleRemoveLastCustomSign = () => {
    setCustomSequence(customSequence.slice(0, -1));
  };

  const handleClearCustomSequence = () => {
    setCustomSequence([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-2xl">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>ISL Gesture Guide</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                  {classes.length} Supported Signs
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-mono uppercase">
                  {activeMode}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Visual instruction, demo sentence combinations, and verified 61-class ISLRTC lexicon
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition active:scale-95"
            title="Close Guide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Official ISLRTC Provenance Banner */}
        <div className="bg-emerald-950/30 border-b border-emerald-900/30 px-6 py-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-emerald-300 gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Authoritative Reference: Indian Sign Language Research and Training Centre (ISLRTC), Govt. of India
            </span>
          </div>
          <a
            href="https://www.data.gov.in/catalog/indian-sign-language-dictionary"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:underline text-emerald-400 font-semibold shrink-0"
          >
            ISLRTC Open Catalog <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-8 bg-slate-950/20 scrollbar-thin">
          
          {/* ==================================================== */}
          {/* 1. SECTION: QUICK LEARN — VISUAL ISL SIGNS           */}
          {/* ==================================================== */}
          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Quick Learn — Visual ISL Signs</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hand-posture references for live sentence demonstration: <strong className="text-emerald-300">HELLO</strong>, <strong className="text-emerald-300">HELP</strong>, and <strong className="text-emerald-300">NEED</strong>.
                </p>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                Instructional References
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {QUICK_LEARN_VISUAL_SIGNS.map((item) => {
                const is3D = viewMode3D[item.id] !== false;
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 flex flex-col justify-between shadow-xl transition-all group"
                  >
                    <div>
                      {/* Top Header with 3D Badge & 2D/3D Mode Toggle */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.hands}
                        </span>
                        <button
                          onClick={() => setViewMode3D((prev) => ({ ...prev, [item.id]: !is3D }))}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/60 transition active:scale-95"
                          title="Toggle between Interactive 3D and 2D Textbook Reference"
                        >
                          {is3D ? 'Switch to 2D' : 'Switch to 3D'}
                        </button>
                      </div>

                      {/* Interactive 3D Hand Model Demonstration or 2D Diagram */}
                      {is3D ? (
                        <div className="mb-3">
                          <Hand3DViewer
                            signId={item.id}
                            fallbackImgSrc={item.imgSrc}
                            autoPlay={true}
                            className="w-full"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-64 sm:h-72 bg-white rounded-xl border border-slate-300 overflow-hidden flex items-center justify-center p-1.5 mb-3 relative shadow-sm">
                          {!imageErrors[item.id] ? (
                            <img
                              src={item.imgSrc}
                              alt={`ISL ${item.name} sign instruction`}
                              loading="lazy"
                              className="w-full h-full object-contain filter contrast-105"
                              onError={() => setImageErrors((prev) => ({ ...prev, [item.id]: true }))}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-3 text-center">
                              <ImageOff className="w-7 h-7 text-slate-400" />
                              <span className="text-xs text-slate-600 font-semibold">Visual reference unavailable</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Label & Instructional Text */}
                      <div className="space-y-1">
                        <div className="flex items-baseline justify-between">
                          <h4 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                            {item.name}
                          </h4>
                          <span className="text-xs font-semibold text-emerald-400">
                            {item.hindiName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-snug">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {item.motion} Motion
                      </span>
                      <button
                        onClick={() => handlePracticeSign(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                      >
                        <span>Practice</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ==================================================== */}
          {/* 2. SECTION: BUILD A SENTENCE (PRIMARY DEMO)          */}
          {/* ==================================================== */}
          <section className="space-y-3.5 pt-2 border-t border-slate-800/80">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  <span>Build a Sentence</span>
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50">
                  Demo combination using supported signs
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Combine supported signs to create simple real-time communication.
              </p>
            </div>

            {/* Primary Demo Card: HELLO -> NEED -> HELP */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border-2 border-indigo-500/50 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-bold uppercase tracking-wider">
                    Primary Live Demo Combination
                  </span>
                  <span className="text-xs text-slate-400">• Progressive sequence</span>
                </div>

                {/* Visual Step Sequence: [ HELLO ] + [ NEED ] + [ HELP ] */}
                <div className="flex items-center flex-wrap gap-2.5">
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-sm shadow-md">
                    HELLO
                  </div>
                  <span className="text-slate-500 font-bold text-base">+</span>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-sm shadow-md">
                    NEED
                  </div>
                  <span className="text-slate-500 font-bold text-base">+</span>
                  <div className="px-3.5 py-2 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-emerald-300 font-bold font-mono text-sm shadow-md">
                    HELP
                  </div>
                </div>

                {/* Progressive Output Result */}
                <div className="text-xs font-mono text-slate-300 flex items-center gap-2">
                  <span className="text-slate-500">Result:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white font-bold">
                    "HELLO • NEED • HELP"
                  </span>
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    (Standard emergency communication request)
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col items-center sm:items-end gap-1.5 w-full md:w-auto">
                <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setActive3DSequence(['Hello', 'Need', 'Help'])}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950/50 transition active:scale-95 border border-blue-400/30"
                    title="Watch the 3D demonstrations of HELLO, NEED, and HELP consecutively"
                  >
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                    <span>Learn this sequence (3D)</span>
                  </button>
                  <button
                    onClick={() => handleTrySentence(['Hello', 'Need', 'Help'])}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 transition active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Try this sentence →</span>
                  </button>
                </div>
                <span className="text-[10px] text-slate-500 text-center sm:text-right">
                  Watch sequential 3D demo first, then verify live with camera
                </span>
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* 3. SECTION: MORE DEMO COMBINATIONS                   */}
          {/* ==================================================== */}
          <section className="space-y-3.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>More Demo Combinations</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                Verified against model vocabulary • Demo combinations
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {PRESET_DEMO_COMBINATIONS.slice(1).map((combo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex flex-col justify-between shadow-md transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                        {combo.category}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {combo.signs.length} signs
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200">
                      {combo.title}
                    </h4>

                    {/* Step chips */}
                    <div className="flex items-center flex-wrap gap-1.5 pt-1">
                      {combo.signs.map((s, sIdx) => (
                        <React.Fragment key={sIdx}>
                          {sIdx > 0 && <span className="text-slate-600 text-xs">+</span>}
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300">
                            {s}
                          </span>
                        </React.Fragment>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 italic pt-1">
                      "{combo.signs.join(' • ')}"
                    </p>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => setActive3DSequence(combo.signs)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/50 text-[11px] font-semibold text-indigo-300 transition active:scale-95"
                      title="Watch sequential 3D demonstrations"
                    >
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span>Learn 3D</span>
                    </button>
                    <button
                      onClick={() => handleTrySentence(combo.signs)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 hover:border-emerald-700/60 border border-slate-700 text-xs font-semibold text-slate-200 transition active:scale-95"
                    >
                      <span>Try Live</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ==================================================== */}
          {/* 4. SECTION: INTERACTIVE SENTENCE BUILDER             */}
          {/* ==================================================== */}
          <section className="space-y-3.5 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Create Your Own Sentence</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pick signs from the supported list to compose a custom sequence for live testing.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full space-y-3">
                {/* Sign Selector + Add Button */}
                <div className="flex items-center gap-2">
                  <select
                    value={selectedAddSign}
                    onChange={(e) => setSelectedAddSign(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.label}>
                        {c.display_name} {c.hindi_name ? `(${c.hindi_name})` : ''} — {c.category || 'General'}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handleAddCustomSign}
                    className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition active:scale-95 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Sign
                  </button>
                </div>

                {/* Composed Sequence Display */}
                <div className="min-h-[44px] p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center flex-wrap gap-2">
                  {customSequence.length === 0 ? (
                    <span className="text-xs text-slate-500 italic">
                      No signs added yet. Choose a sign above and click "+ Add Sign".
                    </span>
                  ) : (
                    customSequence.map((sign, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-slate-600 font-bold text-xs">+</span>}
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-200 text-xs font-mono font-semibold">
                          {sign}
                        </span>
                      </React.Fragment>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch md:self-end shrink-0">
                <button
                  onClick={handleRemoveLastCustomSign}
                  disabled={customSequence.length === 0}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-medium border border-slate-700 transition"
                  title="Remove last sign"
                >
                  Remove
                </button>

                <button
                  onClick={handleClearCustomSequence}
                  disabled={customSequence.length === 0}
                  className="px-3 py-2 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 disabled:opacity-40 rounded-xl text-xs font-medium border border-slate-700 transition"
                  title="Clear sequence"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {customSequence.length > 0 && (
                  <button
                    onClick={() => setActive3DSequence(customSequence)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-950/60 hover:bg-indigo-900/70 border border-indigo-700/50 text-indigo-300 rounded-xl text-xs font-semibold transition active:scale-95"
                    title="Watch 3D sequence for this composed sentence"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Learn 3D
                  </button>
                )}

                <button
                  onClick={() => handleTrySentence(customSequence)}
                  disabled={customSequence.length === 0}
                  className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" /> Try Live
                </button>
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* 5. SECTION: EXISTING 61-SIGN SEARCHABLE LEXICON      */}
          {/* ==================================================== */}
          <section className="space-y-4 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Full 61-Sign Lexicon & Reference Details</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed anatomical breakdown for all 61 signs supported by the neural model.
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Showing {filteredClasses.length} of {classes.length}
              </span>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by English name, Hindi translation, or instruction..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Hand Filter Pills */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0 self-stretch sm:self-auto">
                  {(['All', '1 Hand', '2 Hands'] as const).map((h) => (
                    <button
                      key={h}
                      onClick={() => setHandFilter(h)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                        handFilter === h ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {quickFilterTabs.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition ${
                      selectedFilter === tab ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* 61 Classes Grid */}
            {filteredClasses.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <p className="text-sm font-medium">No signs match your search criteria</p>
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedFilter('All');
                    setHandFilter('All');
                  }}
                  className="mt-2 text-xs text-emerald-400 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredClasses.map((cls) => {
                  const meta = ISL_METADATA_MAP[cls.label] || { hands: 1, motion: 'dynamic', group: 'General' };

                  return (
                    <div
                      key={cls.id}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/50 transition-all shadow-md flex flex-col justify-between group"
                    >
                      <div>
                        {/* Top Badges */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-emerald-400 font-mono">
                            #{cls.id + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                meta.hands === 1
                                  ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50'
                                  : 'bg-purple-950/80 text-purple-300 border border-purple-800/50'
                              }`}
                            >
                              {meta.hands} Hand{meta.hands > 1 ? 's' : ''}
                            </span>
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                              {cls.category || meta.group}
                            </span>
                          </div>
                        </div>

                        {/* Title & Hindi Translation */}
                        <div className="flex items-baseline gap-2 mb-1.5">
                          <h4 className="text-base font-bold text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                            {cls.display_name}
                          </h4>
                          {cls.hindi_name && (
                            <span className="text-xs font-semibold text-emerald-400/90">
                              {cls.hindi_name}
                            </span>
                          )}
                        </div>

                        {/* How To Perform Guide */}
                        {cls.how_to_perform && (
                          <div className="mt-2 bg-slate-950/80 border border-slate-800/90 rounded-xl p-2.5 text-xs text-slate-300 leading-relaxed">
                            <strong className="text-emerald-400 font-medium">How to sign: </strong>
                            {cls.how_to_perform}
                          </div>
                        )}

                        {/* Scenario / Context */}
                        {cls.scenario && (
                          <div className="mt-2 text-[11px] text-slate-500 italic">
                            Context: {cls.scenario}
                          </div>
                        )}
                      </div>

                      {/* Bottom Actions */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {meta.motion === 'static' ? 'Static Pose' : 'Dynamic Movement'}
                        </span>
                        <button
                          onClick={() => handlePracticeSign(cls.label)}
                          className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/50 text-[11px] font-semibold transition active:scale-95"
                        >
                          <Sparkles className="w-3 h-3 text-emerald-400" /> Practice Sign
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Total Supported Vocabulary: <strong className="text-white">{classes.length} signs</strong> • Grounded in ISLRTC standards
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition active:scale-95"
          >
            Close Guide
          </button>
        </div>
      </div>

      {/* Dedicated 3D Sequence Player Modal */}
      <Sequence3DModal
        isOpen={active3DSequence !== null}
        onClose={() => setActive3DSequence(null)}
        sequence={active3DSequence || ['Hello', 'Need', 'Help']}
        onLaunchLive={() => {
          const seq = active3DSequence || ['Hello', 'Need', 'Help'];
          setActive3DSequence(null);
          handleTrySentence(seq);
        }}
      />
    </div>
  );
};
