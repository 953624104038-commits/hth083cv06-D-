import React, { useMemo, useState } from 'react';
import { SearchXIcon } from 'lucide-react';
import { QuickLearnCard } from '../components/guide/QuickLearnCard';
import { SignCard } from '../components/guide/SignCard';
import { Button } from '../components/ui/Button';
import { useNavigation } from '../contexts/NavigationContext';
import { useRecognition } from '../contexts/RecognitionContext';
import { quickLearnSigns } from '../data/quickLearn';
import { handFilters, quickFilterTabs, type HandFilter, type QuickFilterTab } from '../data/signMetadata';
import { useGridArrowNav } from '../hooks/useGridArrowNav';
import { filterSigns } from '../utils/signs';

export function GestureGuide() {
  const { vocabulary, setPracticeSign } = useRecognition();
  const { guideQuery, setGuideQuery, selectedSign, selectSign, navigate } = useNavigation();
  const [filter, setFilter] = useState<QuickFilterTab>('All');
  const [handFilter, setHandFilter] = useState<HandFilter>('All');
  const onGridKeyDown = useGridArrowNav();

  const filtered = useMemo(() => filterSigns(vocabulary, guideQuery, filter, handFilter), [vocabulary, guideQuery, filter, handFilter]);
  const isFiltering = guideQuery.trim() !== '' || filter !== 'All' || handFilter !== 'All';

  const practice = (label: string) => {
    setPracticeSign(label);
    navigate('translator');
  };

  const resetFilters = () => {
    setGuideQuery('');
    setFilter('All');
    setHandFilter('All');
  };

  return (
    <div className="pb-10">
      <header className="bg-[#0f2a1b] px-4 pb-6 pt-8 md:px-6 xl:px-8">
        <p className="text-[13px] font-semibold text-ink/80">Indian Sign Language · ISLRTC lexicon</p>
        <h1 className="mt-1 text-[40px] font-extrabold leading-none tracking-tight text-ink md:text-[48px]">ISL Gesture Guide</h1>
        <p className="mt-3 text-sm text-ink/80">
          <span className="font-bold text-ink">{vocabulary.length} supported signs</span> · Visual instruction, 3D demonstrations and demo sentence
          combinations
        </p>
      </header>

      {/* Filters */}
      <div className="sticky top-0 z-20 border-b border-line bg-surface px-4 py-3 md:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <div className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto" role="radiogroup" aria-label="Category">
            {quickFilterTabs.map((tab) => {
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setFilter(tab)}
                  className={`h-8 shrink-0 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-colors duration-150 ${
                  active ? 'bg-ink text-canvas' : 'bg-raised text-ink hover:bg-[#333]'}`
                  }>
                  
                  {tab}
                </button>);

            })}
          </div>
          <div className="hidden shrink-0 rounded-full bg-raised p-0.5 sm:flex" role="radiogroup" aria-label="Hands">
            {handFilters.map((h) => {
              const active = handFilter === h;
              return (
                <button
                  key={h}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setHandFilter(h)}
                  className={`h-7 whitespace-nowrap rounded-full px-3 text-xs font-bold transition-colors duration-150 ${
                  active ? 'bg-ink text-canvas' : 'text-muted hover:text-ink'}`
                  }>
                  
                  {h}
                </button>);

            })}
          </div>
        </div>
      </div>

      <div className="space-y-10 px-4 pt-6 md:px-6 xl:px-8">
        {!isFiltering &&
        <section aria-labelledby="quick-learn-heading">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 id="quick-learn-heading" className="text-2xl font-bold text-ink">
                  Quick learn
                </h2>
                <p className="text-sm text-muted">Interactive 3D demonstrations — drag a hand to rotate it</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
              {quickLearnSigns.map((item) =>
            <QuickLearnCard
              key={item.id}
              item={item}
              selected={selectedSign === item.id}
              onSelect={() => selectSign(item.id)}
              onPractice={() => practice(item.id)} />

            )}
            </div>
          </section>
        }

        <section aria-labelledby="all-signs-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 id="all-signs-heading" className="text-2xl font-bold text-ink">
                {isFiltering ? 'Matching signs' : 'All supported signs'}
              </h2>
              <p className="text-sm text-muted" aria-live="polite">
                Showing {filtered.length} of {vocabulary.length}
                {guideQuery.trim() && <> for “{guideQuery.trim()}”</>}
              </p>
            </div>
            {isFiltering &&
            <Button size="sm" variant="ghost" onClick={resetFilters}>
                Reset filters
              </Button>
            }
          </div>

          {filtered.length === 0 ?
          <div className="flex flex-col items-center rounded-lg bg-card px-6 py-14 text-center">
              <SearchXIcon className="h-10 w-10 text-subtle" aria-hidden="true" />
              <p className="mt-4 text-lg font-bold text-ink">No signs match</p>
              <p className="mt-1 max-w-sm text-sm text-muted">Try an English or Hindi name, a category like “Food”, or clear the filters.</p>
              <Button className="mt-5" variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            </div> :

          <div
            className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-4"
            onKeyDown={onGridKeyDown}
            role="group"
            aria-label="Signs. Use arrow keys to move between signs.">
            
              {filtered.map((sign) =>
            <SignCard
              key={sign.label}
              sign={sign}
              selected={selectedSign === sign.label}
              onSelect={() => selectSign(sign.label)}
              onPractice={() => practice(sign.display_name)} />

            )}
            </div>
          }
        </section>

        <footer className="border-t border-line pt-6 text-xs leading-relaxed text-subtle">
          Authoritative reference: Indian Sign Language Research and Training Centre (ISLRTC), Govt. of India.
        </footer>
      </div>
    </div>);

}