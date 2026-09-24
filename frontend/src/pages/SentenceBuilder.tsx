import React from 'react';
import { CombinationCard } from '../components/builder/CombinationCard';
import { CustomSentenceComposer } from '../components/builder/CustomSentenceComposer';
import { PrimarySequence } from '../components/builder/PrimarySequence';
import { ScenarioList } from '../components/builder/ScenarioList';
import { useNavigation } from '../contexts/NavigationContext';
import { useRecognition } from '../contexts/RecognitionContext';
import { curatedDemoSigns, presetDemoCombinations, verifiedDemoScenarios } from '../data/combinations';

export function SentenceBuilder() {
  const { startTargetSentence, appendWord, islWords, mode } = useRecognition();
  const { navigate, openSequence } = useNavigation();

  const trySentence = (signs: string[]) => {
    startTargetSentence(signs);
    navigate('translator');
  };

  const primary = presetDemoCombinations[0];

  return (
    <div className="space-y-10 px-4 pb-10 pt-6 md:px-6 xl:px-8">
      <header>
        <h1 className="text-[32px] font-extrabold leading-tight tracking-tight text-ink">Build a Sentence</h1>
        <p className="mt-1 text-sm text-muted">Chain supported signs into a sequence, then perform it live in front of the camera.</p>
      </header>

      <PrimarySequence signs={primary.signs} onTry={() => trySentence(primary.signs)} onLearn3D={() => openSequence(primary.signs)} />

      <section aria-labelledby="combos-heading">
        <h2 id="combos-heading" className="text-2xl font-bold text-ink">
          More demo combinations
        </h2>
        <p className="mb-4 text-sm text-muted">Each uses only supported signs</p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          {presetDemoCombinations.slice(1).map((combo) =>
          <CombinationCard key={combo.id} combo={combo} onTry={() => trySentence(combo.signs)} onLearn3D={() => openSequence(combo.signs)} />
          )}
        </div>
      </section>

      <section aria-labelledby="scenarios-heading">
        <h2 id="scenarios-heading" className="text-2xl font-bold text-ink">
          Verified demo scenarios
        </h2>
        <p className="mb-4 text-sm text-muted">Longer sequences for real service situations</p>
        <ScenarioList scenarios={verifiedDemoScenarios} onTry={trySentence} />
      </section>

      <section aria-labelledby="compose-heading" className="grid gap-8 xl:grid-cols-2">
        <div>
          <h2 id="compose-heading" className="text-2xl font-bold text-ink">
            Create your own sentence
          </h2>
          <p className="mb-4 text-sm text-muted">Pick signs from the full lexicon, learn them in 3D, then try them live</p>
          <CustomSentenceComposer onTry={trySentence} onLearn3D={openSequence} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-ink">Quick sign palette</h2>
          <p className="mb-4 text-sm text-muted">
            Tap to add a sign to your live sentence
            {mode === 'isl' && islWords.length > 0 && <> · {islWords.length} in sentence</>}
          </p>
          <ul className="flex flex-wrap gap-2">
            {curatedDemoSigns.map((s) =>
            <li key={s.sign}>
                <button
                type="button"
                onClick={() => appendWord(s.sign)}
                className="flex h-10 items-center gap-2 rounded-full bg-raised pl-4 pr-3 text-sm transition-colors duration-150 hover:bg-[#333]"
                aria-label={`Add ${s.sign} to sentence`}>
                
                  <span className="font-bold text-ink">{s.sign}</span>
                  <span className="font-hindi text-muted">{s.hindi}</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </section>
    </div>);

}