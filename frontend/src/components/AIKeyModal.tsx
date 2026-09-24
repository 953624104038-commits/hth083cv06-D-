import React, { useState, useEffect } from 'react';
import { Key, Check, AlertCircle, X, ExternalLink, Loader2, Cpu } from 'lucide-react';

interface AIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: () => void;
}

export const AIKeyModal: React.FC<AIKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyUpdated,
}) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<{ configured: boolean; active: boolean; engine: string } | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch current AI engine status on open
  useEffect(() => {
    if (isOpen) {
      setFeedback(null);
      fetch('http://localhost:8000/api/gemini-status')
        .then(res => res.json())
        .then(data => setStatus(data))
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    if (!apiKey.trim()) {
      setFeedback({ type: 'error', message: 'Please enter a valid API key' });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch('http://localhost:8000/api/set-gemini-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ api_key: apiKey.trim() }),
      });
      const data = await res.json();

      if (data.valid) {
        setFeedback({ type: 'success', message: 'Cloud AI Neural Engine connected and verified successfully!' });
        setStatus({ configured: true, active: true, engine: 'Cloud Neural Engine' });
        onKeyUpdated();
        setTimeout(() => {
          onClose();
        }, 1400);
      } else {
        setFeedback({
          type: 'error',
          message: data.message ? data.message.replace(/Gemini/gi, 'AI') : 'Key validation failed. Make sure the key starts with AIzaSy...',
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: 'Could not connect to backend translation server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0F1422] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0B0F1A] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Cpu className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                AI Neural Engine Configuration
              </h2>
              <p className="text-xs text-slate-400">
                Grammar synthesis & real-time multilingual translation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Active Engine Indicator */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Active Translation Core:</span>
            <span
              className={`font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                status?.active
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                  : 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  status?.active ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'
                }`}
              />
              {status?.active
                ? 'Cloud Neural AI Model (Online)'
                : 'Offline Knowledge Base (Zero-Latency)'}
            </span>
          </div>

          {/* API Key Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" /> Enter AI API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono transition pr-20"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded-md bg-slate-850 hover:bg-slate-800 transition"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              API key starts with <code className="text-indigo-400 font-mono">AIzaSy...</code>
            </p>
          </div>

          {/* Feedback Message */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs animate-fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{feedback.message}</div>
            </div>
          )}

          {/* External Key Link */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
            <span>Need an AI API key?</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 underline"
            >
              Get Free AI Key <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-3.5 bg-[#0B0F1A] border-t border-slate-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
          >
            Close
          </button>
          <button
            onClick={handleSaveAndTest}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-950/50 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
              </>
            ) : (
              <>
                <Cpu className="w-3.5 h-3.5" /> Connect AI Engine
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
