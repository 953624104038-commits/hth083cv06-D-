import React from 'react';
import { X, Play, Video, Info } from 'lucide-react';

interface DemoModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectVideo: (videoName: string) => void;
}

const BENCHMARK_SAMPLES = [
  { name: 'Fever.mp4', label: 'FEVER (बुखार)', desc: 'Medical emergency temperature sign ("I have fever")' },
  { name: 'Hello.mp4', label: 'HELLO (नमस्ते)', desc: 'Standard ISL greeting gesture' },
  { name: 'Thank you.mp4', label: 'THANK YOU (धन्यवाद)', desc: 'Bilateral expression of gratitude' },
  { name: 'Drink.mp4', label: 'DRINK (पीना)', desc: 'Drinking water necessity gesture' },
  { name: 'Tea.mp4', label: 'TEA (चाय)', desc: 'Refreshment / tea request gesture' },
  { name: 'Injury.mp4', label: 'INJURY (चोट)', desc: 'Healthcare emergency hurt/wound gesture' },
  { name: 'Clean.mp4', label: 'CLEAN (साफ)', desc: 'Service / cleanliness counter request' },
  { name: 'Good morning.mp4', label: 'GOOD MORNING (शुभ प्रभात)', desc: 'Formal service desk greeting' },
  { name: 'Come.mp4', label: 'COME (आइए)', desc: 'Directional invitation to approach counter' },
  { name: 'Give.mp4', label: 'GIVE (दीजिए)', desc: 'Presenting / submitting document' },
  { name: 'Close.mp4', label: 'CLOSE (बंद)', desc: 'Transaction completed / counter closed' },
];

export const DemoModeModal: React.FC<DemoModeModalProps> = ({ isOpen, onClose, onSelectVideo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Video className="w-5 h-5 text-indigo-400" />
            <div>
              <h2 className="text-base font-bold text-white">Judge Demo & Fallback Mode</h2>
              <p className="text-xs text-slate-400">Evaluate gesture recognition without requiring a webcam</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="bg-indigo-950/30 border-b border-indigo-900/30 px-6 py-3 flex items-start gap-2 text-xs text-indigo-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            Select an official benchmark video recorded by native signers. The pipeline will feed the video into MediaPipe and the classifier in real-time.
          </span>
        </div>

        {/* Video List */}
        <div className="p-6 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {BENCHMARK_SAMPLES.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                onSelectVideo(item.name);
                onClose();
              }}
              className="w-full text-left p-3.5 rounded-xl bg-slate-950/60 hover:bg-indigo-950/50 border border-slate-800 hover:border-indigo-600/50 transition flex items-center justify-between group"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-white group-hover:text-indigo-200">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.name}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {item.desc}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800 group-hover:bg-indigo-600 text-slate-300 group-hover:text-white transition shrink-0 ml-3">
                <Play className="w-4 h-4 fill-current" />
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
