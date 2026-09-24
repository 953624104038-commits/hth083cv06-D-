import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Send, MessageSquarePlus } from 'lucide-react';

interface StaffTwoWayPanelProps {
  onSendMessage: (text: string, visualHint?: string) => void;
}

const PREDEFINED_STAFF_PHRASES = [
  { id: 'WAIT', text: 'Please wait a moment', hint: 'Show STOP / WAIT gesture' },
  { id: 'DOC', text: 'Please show or submit your document', hint: 'Show GIVE gesture' },
  { id: 'HELP', text: 'How may I help you today?', hint: 'Show HELP gesture' },
  { id: 'NAME', text: 'Please show your name or ID card', hint: 'Show WHAT IS YOUR NAME gesture' },
  { id: 'WATER', text: 'Drinking water is available on your left', hint: 'Show WATER gesture' },
  { id: 'DONE', text: 'Your request is complete. Thank you!', hint: 'Show THANK YOU gesture' },
];

export const StaffTwoWayPanel: React.FC<StaffTwoWayPanelProps> = ({ onSendMessage }) => {
  const [customText, setCustomText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use the quick phrase buttons or manual input.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          // Predefined phrase matching
          const matched = PREDEFINED_STAFF_PHRASES.find(p =>
            transcript.toLowerCase().includes(p.text.toLowerCase()) ||
            p.text.toLowerCase().includes(transcript.toLowerCase())
          );
          if (matched) {
            onSendMessage(matched.text, matched.hint);
          } else {
            onSendMessage(transcript);
          }
        }
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim()) return;
    onSendMessage(customText.trim());
    setCustomText('');
  };

  return (
    <div className="bg-[#0E1322] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white">Staff-to-Visitor Bridge</h3>
          <span className="text-[11px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
            Two-Way
          </span>
        </div>

        {speechSupported && (
          <button
            onClick={toggleSpeechRecognition}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30'
            }`}
          >
            {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isListening ? 'Listening...' : 'Staff Mic'}
          </button>
        )}
      </div>

      {/* Quick Predefined Counter Phrases */}
      <div className="mb-4">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Quick Counter Responses
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PREDEFINED_STAFF_PHRASES.map((phrase) => (
            <button
              key={phrase.id}
              onClick={() => onSendMessage(phrase.text, phrase.hint)}
              className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-indigo-950/60 border border-slate-700/80 hover:border-indigo-600/60 transition group"
            >
              <p className="text-xs font-medium text-slate-200 group-hover:text-indigo-200 line-clamp-1">
                {phrase.text}
              </p>
              <p className="text-[10px] text-slate-400 group-hover:text-indigo-300 line-clamp-1 mt-0.5">
                {phrase.hint}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Manual Text Input Fallback */}
      <form onSubmit={handleCustomSubmit} className="mt-auto flex items-center gap-2">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type message for Deaf visitor..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        <button
          type="submit"
          disabled={!customText.trim()}
          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
