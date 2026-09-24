import React from 'react';
import { Volume2, Trash2, Download, MessageSquare, User, Building } from 'lucide-react';
import type { TranscriptEntry } from '../types';

interface TranscriptTimelineProps {
  entries: TranscriptEntry[];
  onClear: () => void;
  onSpeak: (text: string) => void;
}

export const TranscriptTimeline: React.FC<TranscriptTimelineProps> = ({
  entries,
  onClear,
  onSpeak,
}) => {
  const exportTranscript = () => {
    if (entries.length === 0) return;
    const content = entries
      .map(e => `[${e.timestamp}] ${e.speaker}: ${e.text}${e.confidence ? ` (Conf: ${Math.round(e.confidence * 100)}%)` : ''}`)
      .join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ISL_Counter_Transcript_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-bold text-white">Conversation History</h3>
          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-medium">
            {entries.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={exportTranscript}
            disabled={entries.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            title="Export transcript as text file"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClear}
            disabled={entries.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition"
            title="Clear history"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Timeline Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[300px]">
        {entries.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500">
            <p className="text-xs">No signs recorded yet in this session.</p>
            <p className="text-[11px] text-slate-600 mt-1">Recognized signs and staff responses will appear here.</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isVisitor = entry.speaker === 'VISITOR';
            return (
              <div
                key={entry.id}
                className={`p-3 rounded-xl border transition-all ${
                  isVisitor
                    ? 'bg-slate-950/60 border-emerald-900/40 text-slate-100'
                    : 'bg-indigo-950/40 border-indigo-800/40 text-indigo-100'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <div className="flex items-center gap-1.5 font-bold">
                    {isVisitor ? (
                      <>
                        <User className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Visitor (ISL Sign)</span>
                      </>
                    ) : (
                      <>
                        <Building className="w-3 h-3 text-indigo-400" />
                        <span className="text-indigo-400">Counter Staff</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    {entry.confidence && (
                      <span className="text-emerald-400/90 font-medium">
                        {Math.round(entry.confidence * 100)}%
                      </span>
                    )}
                    <span>{entry.timestamp}</span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{entry.text}</p>
                    {entry.visualHint && (
                      <p className="text-xs text-indigo-300 mt-1 italic">
                        💡 {entry.visualHint}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onSpeak(entry.text)}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Speak text"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
