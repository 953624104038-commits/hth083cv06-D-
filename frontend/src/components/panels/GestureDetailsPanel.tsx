import React from 'react';
import { CameraIcon, XIcon } from 'lucide-react';
import { useNavigation } from '../../contexts/NavigationContext';
import { useRecognition } from '../../contexts/RecognitionContext';
import { findSign, getSignMeta } from '../../utils/signs';
import { Hand3DViewer } from '../hand3d/Hand3DViewer';
import { has3D } from '../hand3d/gestureAnimations';
import { SignArtwork } from '../guide/SignArtwork';
import { Button } from '../ui/Button';

export function GestureDetailsPanel({ label }: {label: string;}) {
  const { vocabulary, setPracticeSign } = useRecognition();
  const { selectSign, navigate, setDetailsOpen } = useNavigation();
  const sign = findSign(vocabulary, label);
  if (!sign) return null;
  const meta = getSignMeta(sign.label);
  const with3D = has3D(sign.label);

  const practice = () => {
    setPracticeSign(sign.display_name);
    setDetailsOpen(false);
    navigate('translator');
  };

  return (
    <div className="flex flex-col gap-5 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-ink">Gesture details</h2>
        <button
          type="button"
          onClick={() => {
            selectSign(null);
            setDetailsOpen(false);
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-raised hover:text-ink"
          aria-label="Close gesture details (Escape)">
          
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {with3D ?
      <Hand3DViewer key={sign.label} signId={sign.label} stageClassName="h-64" /> :

      <div>
          <SignArtwork sign={sign} className="aspect-[4/3] w-full rounded-lg" large />
          <p className="mt-2 text-xs text-subtle">3D demonstrations are available for Hello, Help, Need and Thank you.</p>
        </div>
      }

      <div>
        <h3 className="text-[28px] font-extrabold leading-tight tracking-tight text-ink">{sign.display_name}</h3>
        <p className="mt-1 font-hindi text-lg text-muted">{sign.hindi_name}</p>
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Sign attributes">
          <li className="rounded-full bg-raised px-3 py-1 text-xs font-semibold text-ink">{sign.category}</li>
          <li className="rounded-full bg-raised px-3 py-1 text-xs font-semibold text-ink">{meta.hands === 2 ? '2 hands' : '1 hand'}</li>
          <li className="rounded-full bg-raised px-3 py-1 text-xs font-semibold capitalize text-ink">{meta.motion}</li>
        </ul>
      </div>

      <Button variant="primary" size="lg" icon={CameraIcon} onClick={practice} className="w-full">
        Practice live
      </Button>

      <section className="rounded-lg bg-card p-4" aria-labelledby="gd-how">
        <h4 id="gd-how" className="text-[13px] font-bold text-muted">
          How to perform
        </h4>
        <p className="mt-2 text-[15px] leading-relaxed text-ink">{sign.how_to_perform}</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-t border-line pt-4 text-[13px]">
          <dt className="text-muted">Scenario</dt>
          <dd className="text-ink">{sign.scenario}</dd>
          {sign.source &&
          <>
              <dt className="text-muted">Source</dt>
              <dd className="text-ink">{sign.source}</dd>
            </>
          }
        </dl>
      </section>
    </div>);

}