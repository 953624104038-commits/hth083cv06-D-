import React from 'react';
import { DownloadIcon, HistoryIcon, Trash2Icon, Volume2Icon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useNavigation } from '../contexts/NavigationContext';
import { useRecognition } from '../contexts/RecognitionContext';
import { toPercent } from '../utils/recognition';

export function ConversationHistory() {
  const { transcript, clearTranscript, exportTranscript, speak } = useRecognition();
  const { navigate } = useNavigation();

  return (
    <div className="space-y-6 px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-ink">Conversation history</h1>
          <p className="mt-1 text-sm text-muted">
            {transcript.length} of up to 50 entries this session · Cleared when you close VOXIS
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" icon={DownloadIcon} onClick={exportTranscript} disabled={!transcript.length}>
            Export .txt
          </Button>
          <Button variant="ghost" size="sm" icon={Trash2Icon} onClick={clearTranscript} disabled={!transcript.length}>
            Clear
          </Button>
        </div>
      </header>

      {transcript.length === 0 ?
      <div className="flex flex-col items-center rounded-lg bg-card px-6 py-16 text-center">
          <HistoryIcon className="h-10 w-10 text-subtle" aria-hidden="true" />
          <p className="mt-4 text-lg font-bold text-ink">No conversation yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">Every sign recognized in the Live Translator is logged here with its time and confidence.</p>
          <Button className="mt-5" variant="primary" onClick={() => navigate('translator')}>
            Open Live Translator
          </Button>
        </div> :

      <table className="w-full table-fixed text-left">
          <thead>
            <tr className="border-b border-line text-xs font-semibold text-muted">
              <th scope="col" className="w-28 pb-2 pl-4 font-semibold">
                Time
              </th>
              <th scope="col" className="pb-2 font-semibold">
                Sign
              </th>
              <th scope="col" className="hidden pb-2 font-semibold sm:table-cell">
                Hindi
              </th>
              <th scope="col" className="w-24 pb-2 font-semibold">
                Confidence
              </th>
              <th scope="col" className="w-14 pb-2">
                <span className="sr-only">Speak</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {transcript.map((e) =>
          <tr key={e.id} className="group transition-colors duration-150 hover:bg-raised">
                <td className="rounded-l-md py-3 pl-4 text-sm tabular-nums text-muted">{e.timestamp}</td>
                <td className="truncate py-3 text-[15px] font-semibold text-ink">{e.text}</td>
                <td className="hidden truncate py-3 font-hindi text-sm text-muted sm:table-cell">{e.hindi_name ?? '—'}</td>
                <td className="py-3 text-sm text-muted">{typeof e.confidence === 'number' ? `${toPercent(e.confidence)}%` : '—'}</td>
                <td className="rounded-r-md py-3 pr-2">
                  <button
                type="button"
                onClick={() => speak(e.hindi_name ? `${e.text}. ${e.hindi_name}` : e.text)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-[#333] hover:text-ink"
                aria-label={`Speak ${e.text}`}>
                
                    <Volume2Icon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
          )}
          </tbody>
        </table>
      }
    </div>);

}