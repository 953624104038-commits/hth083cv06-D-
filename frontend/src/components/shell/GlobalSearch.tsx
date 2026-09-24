import React, { useMemo, useRef, useState } from 'react';
import { SearchIcon, XIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { historyNav, primaryNav } from '../../data/navigation';
import { filterSigns, primaryHindi } from '../../utils/signs';
import type { View } from '../../types/voxis';

type Result =
{kind: 'feature';id: string;label: string;view: View;} |
{kind: 'sign';id: string;label: string;hindi: string;category: string;} |
{kind: 'all';id: string;label: string;};

/**
 * On the Gesture Guide the field drives the guide's existing search/filter directly.
 * Elsewhere it searches locally across app sections and the sign lexicon.
 */
export function GlobalSearch() {
  const { view, navigate, guideQuery, setGuideQuery, selectSign } = useNavigation();
  const { vocabulary } = useRecognition();
  const [localQuery, setLocalQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const onGuide = view === 'guide';
  const query = onGuide ? guideQuery : localQuery;
  const placeholder = onGuide ? 'Search signs, Hindi names, or categories' : 'Search gestures, guides, or features';

  const results = useMemo<Result[]>(() => {
    const q = localQuery.trim().toLowerCase();
    if (onGuide || !q) return [];
    const features: Result[] = [...primaryNav, historyNav].
    filter((n) => n.label.toLowerCase().includes(q) || n.keywords.includes(q)).
    map((n) => ({ kind: 'feature', id: `f-${n.view}`, label: n.label, view: n.view }));
    const signs = filterSigns(vocabulary, localQuery.trim(), 'All', 'All');
    const signResults: Result[] = signs.slice(0, 6).map((s) => ({
      kind: 'sign',
      id: `s-${s.label}`,
      label: s.display_name,
      hindi: primaryHindi(s.hindi_name),
      category: s.category
    }));
    const all: Result[] = signs.length > 6 ? [{ kind: 'all', id: 'all', label: `See all ${signs.length} matching signs` }] : [];
    return [...features, ...signResults, ...all];
  }, [localQuery, onGuide, vocabulary]);

  const choose = (r: Result) => {
    if (r.kind === 'feature') navigate(r.view);
    if (r.kind === 'sign') {
      setGuideQuery('');
      selectSign(r.label);
      navigate('guide');
    }
    if (r.kind === 'all') {
      setGuideQuery(localQuery.trim());
      navigate('guide');
    }
    setLocalQuery('');
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onGuide) {
      if (e.key === 'Escape' && guideQuery) {
        e.stopPropagation();
        setGuideQuery('');
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      e.preventDefault();
      choose(results[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setLocalQuery('');
    }
  };

  const showList = !onGuide && open && localQuery.trim().length > 0;

  return (
    <div className="relative w-full max-w-[480px]">
      <label htmlFor="voxis-search" className="sr-only">
        {placeholder}
      </label>
      <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input
        ref={inputRef}
        id="voxis-search"
        type="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls="voxis-search-results"
        aria-activedescendant={showList && results[activeIdx] ? `sr-${results[activeIdx].id}` : undefined}
        autoComplete="off"
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          if (onGuide) setGuideQuery(e.target.value);else
          {
            setLocalQuery(e.target.value);
            setOpen(true);
            setActiveIdx(0);
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        className="h-12 w-full rounded-full border border-transparent bg-raised pl-12 pr-12 text-[15px] text-ink placeholder:text-muted transition-colors duration-150 hover:border-line-strong hover:bg-[#2f2f2f] focus:border-ink focus:outline-none [&::-webkit-search-cancel-button]:hidden" />
      
      {query ?
      <button
        type="button"
        onClick={() => onGuide ? setGuideQuery('') : setLocalQuery('')}
        className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:text-ink"
        aria-label="Clear search">
        
          <XIcon className="h-4 w-4" />
        </button> :

      <kbd className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 rounded border border-line-strong px-1.5 text-[11px] font-semibold text-muted lg:block">
          /
        </kbd>
      }

      {showList &&
      <ul
        id="voxis-search-results"
        role="listbox"
        className="absolute left-0 right-0 top-14 z-40 max-h-[60vh] overflow-y-auto rounded-lg bg-[#242424] p-1.5 shadow-2xl shadow-black/60">
        
          {results.length === 0 && <li className="px-3 py-3 text-sm text-muted">No matches for “{localQuery}”.</li>}
          {results.map((r, i) =>
        <li
          key={r.id}
          id={`sr-${r.id}`}
          role="option"
          aria-selected={i === activeIdx}
          onMouseDown={(e) => {
            e.preventDefault();
            choose(r);
          }}
          onMouseEnter={() => setActiveIdx(i)}
          className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2.5 ${i === activeIdx ? 'bg-raised' : ''}`}>
          
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{r.label}</span>
                {r.kind === 'sign' &&
            <span className="block truncate text-xs text-muted">
                    <span className="font-hindi">{r.hindi}</span> · {r.category}
                  </span>
            }
              </span>
              <span className="shrink-0 text-xs font-semibold text-muted">
                {r.kind === 'feature' ? 'Section' : r.kind === 'sign' ? 'Sign' : 'Gesture Guide'}
              </span>
            </li>
        )}
        </ul>
      }
    </div>);

}