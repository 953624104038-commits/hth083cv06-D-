import React from 'react';
import { CrosshairIcon, ListChecksIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { historyNav, primaryNav, type NavItem } from '../../data/navigation';
import { findSign, getGroupTint, primaryHindi } from '../../utils/signs';

export function Sidebar() {
  const { view, navigate, selectSign } = useNavigation();
  const { transcript, practiceSign, targetSentence, targetStepIndex, vocabulary } = useRecognition();

  const recent = Array.from(new Set(transcript.map((t) => t.text))).slice(0, 5);

  const openSign = (label: string) => {
    selectSign(label);
    navigate('guide');
  };

  return (
    <aside className="hidden w-[72px] shrink-0 flex-col gap-2 md:flex xl:w-[280px]" aria-label="Primary">
      <nav className="rounded-lg bg-surface p-2 xl:p-3">
        <ul className="space-y-1">
          {primaryNav.map((item) =>
          <li key={item.view}>
              <SidebarLink item={item} active={view === item.view} onClick={() => navigate(item.view)} />
            </li>
          )}
        </ul>
      </nav>

      <section className="flex min-h-0 flex-1 flex-col rounded-lg bg-surface" aria-labelledby="activity-heading">
        <h2 id="activity-heading" className="hidden px-5 pb-2 pt-4 text-[15px] font-bold text-ink xl:block">
          Your activity
        </h2>
        <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-2 xl:px-3 xl:pt-0">
          <ul className="space-y-1">
            <li>
              <SidebarLink
                item={historyNav}
                active={view === 'history'}
                onClick={() => navigate('history')}
                meta={`${transcript.length} ${transcript.length === 1 ? 'entry' : 'entries'} this session`} />
              
            </li>
            {practiceSign &&
            <li>
                <ActivityRow
                icon={<CrosshairIcon className="h-5 w-5" aria-hidden="true" />}
                title={`Practicing ${practiceSign}`}
                meta="Practice target"
                onClick={() => navigate('translator')} />
              
              </li>
            }
            {targetSentence &&
            <li>
                <ActivityRow
                icon={<ListChecksIcon className="h-5 w-5" aria-hidden="true" />}
                title={targetSentence.join(' → ')}
                meta={`Target sentence · ${Math.min(targetStepIndex, targetSentence.length)} of ${targetSentence.length}`}
                onClick={() => navigate('translator')} />
              
              </li>
            }
          </ul>

          <div className="mt-4 hidden xl:block">
            <h3 className="px-2 pb-2 text-[13px] font-bold text-muted">Recent signs</h3>
            {recent.length === 0 ?
            <p className="px-2 text-[13px] leading-relaxed text-subtle">
                Signs you communicate appear here. Nothing is saved after you close VOXIS.
              </p> :

            <ul className="space-y-0.5">
                {recent.map((label) => {
                const sign = findSign(vocabulary, label);
                return (
                  <li key={label}>
                      <button
                      type="button"
                      onClick={() => openSign(sign?.label ?? label)}
                      className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors duration-150 hover:bg-raised">
                      
                        <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded font-hindi text-sm font-semibold text-ink"
                        style={{ backgroundColor: getGroupTint(sign?.label ?? label) }}
                        aria-hidden="true">
                        
                          {sign ? primaryHindi(sign.hindi_name).slice(0, 2) : label.slice(0, 1)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink">{label}</span>
                          <span className="block truncate font-hindi text-xs text-muted">{sign ? primaryHindi(sign.hindi_name) : 'Sign'}</span>
                        </span>
                      </button>
                    </li>);

              })}
              </ul>
            }
          </div>
        </div>
      </section>
    </aside>);

}

function SidebarLink({ item, active, onClick, meta }: {item: NavItem;active: boolean;onClick: () => void;meta?: string;}) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      title={item.label}
      className={`group flex w-full items-center justify-center gap-4 rounded-md px-3 py-2.5 text-left transition-colors duration-150 xl:justify-start ${
      active ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-raised hover:text-ink'}`
      }>
      
      <Icon className="h-6 w-6 shrink-0" aria-hidden="true" />
      <span className="sr-only xl:not-sr-only xl:min-w-0">
        <span className={`block truncate text-[15px] font-bold ${active ? 'text-accent' : ''}`}>{item.label}</span>
        {meta && <span className="block truncate text-xs font-medium text-muted">{meta}</span>}
      </span>
    </button>);

}

function ActivityRow({ icon, title, meta, onClick }: {icon: React.ReactNode;title: string;meta: string;onClick: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="flex w-full items-center justify-center gap-4 rounded-md px-3 py-2.5 text-left text-muted transition-colors duration-150 hover:bg-raised hover:text-ink xl:justify-start">
      
      <span className="shrink-0 text-accent">{icon}</span>
      <span className="sr-only xl:not-sr-only xl:min-w-0">
        <span className="block truncate text-[15px] font-bold text-ink">{title}</span>
        <span className="block truncate text-xs font-medium">{meta}</span>
      </span>
    </button>);

}