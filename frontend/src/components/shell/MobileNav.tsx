import React from 'react';
import { useNavigation } from '../../contexts/NavigationContext';
import { historyNav, primaryNav } from '../../data/navigation';

const SHORT: Record<string, string> = {
  translator: 'Translate',
  guide: 'Guide',
  builder: 'Sentence',
  history: 'History'
};

export function MobileNav() {
  const { view, navigate } = useNavigation();
  return (
    <nav className="grid shrink-0 grid-cols-4 border-t border-line bg-canvas md:hidden" aria-label="Primary">
      {[...primaryNav, historyNav].map((item) => {
        const Icon = item.icon;
        const active = view === item.view;
        return (
          <button
            key={item.view}
            type="button"
            onClick={() => navigate(item.view)}
            aria-current={active ? 'page' : undefined}
            className={`flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? 'text-accent' : 'text-muted'}`}>
            
            <Icon className="h-5 w-5" aria-hidden="true" />
            {SHORT[item.view]}
          </button>);

      })}
    </nav>);

}