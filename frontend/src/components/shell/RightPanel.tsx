import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { CurrentCommunicationPanel } from '../panels/CurrentCommunicationPanel';
import { GestureDetailsPanel } from '../panels/GestureDetailsPanel';

function PanelContent() {
  const { view, selectedSign } = useNavigation();
  if (view === 'guide' && selectedSign) return <GestureDetailsPanel label={selectedSign} />;
  return <CurrentCommunicationPanel />;
}

/** Docked context panel on desktop; drawer / bottom sheet below lg. */
export function RightPanel() {
  const { detailsOpen, setDetailsOpen } = useNavigation();

  return (
    <>
      <aside className="scroll-thin hidden w-[340px] shrink-0 overflow-y-auto rounded-lg bg-surface lg:block" aria-label="Context panel">
        <PanelContent />
      </aside>

      <AnimatePresence>
        {detailsOpen &&
        <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setDetailsOpen(false)}
            aria-hidden="true" />
          
            <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Context panel"
            className="scroll-thin absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-surface md:inset-y-2 md:left-auto md:right-2 md:max-h-none md:w-[360px] md:rounded-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}>
            
              <div className="sticky top-0 z-10 flex justify-end bg-surface px-2 pt-2">
                <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-raised hover:text-ink"
                aria-label="Close panel"
                autoFocus>
                
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
              <PanelContent />
            </motion.aside>
          </div>
        }
      </AnimatePresence>
    </>);

}