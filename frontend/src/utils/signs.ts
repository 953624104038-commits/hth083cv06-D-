import { groupTints, islMetadataMap, type HandFilter, type QuickFilterTab } from '../data/signMetadata';
import type { SignClass, SignMetadata } from '../types/voxis';

export function getSignMeta(label: string): SignMetadata {
  return islMetadataMap[label] || { hands: 1, motion: 'dynamic', group: 'General' };
}

export function getGroupTint(label: string): string {
  return groupTints[getSignMeta(label).group] || groupTints.General;
}

export function findSign(vocabulary: SignClass[], name: string): SignClass | undefined {
  const key = name.trim().toLowerCase();
  return vocabulary.find((s) => s.label.toLowerCase() === key || s.display_name.toLowerCase() === key);
}

/** Primary Hindi word only (e.g. "नमस्ते / हैलो" -> "नमस्ते"). */
export function primaryHindi(hindi: string): string {
  return hindi.split('/')[0].trim();
}

// Filter logic ported from VocabularyModal.
export function filterSigns(
classes: SignClass[],
search: string,
selectedFilter: QuickFilterTab,
handFilter: HandFilter)
: SignClass[] {
  const q = search.toLowerCase();
  return classes.filter((cls) => {
    const meta = getSignMeta(cls.label);

    const matchesSearch =
    cls.label && cls.label.toLowerCase().includes(q) ||
    cls.display_name && cls.display_name.toLowerCase().includes(q) ||
    cls.hindi_name && cls.hindi_name.includes(search) ||
    cls.category && cls.category.toLowerCase().includes(q) ||
    cls.how_to_perform && cls.how_to_perform.toLowerCase().includes(q);

    const matchesHand =
    handFilter === 'All' ||
    handFilter === '1 Hand' && meta.hands === 1 ||
    handFilter === '2 Hands' && meta.hands === 2;

    let matchesGroup = true;
    if (selectedFilter === 'Greetings & Service') {
      matchesGroup = ['Greetings', 'Finance', 'Work'].includes(meta.group) || cls.category === 'Greetings';
    } else if (selectedFilter === 'Healthcare & Emergency') {
      matchesGroup = ['Healthcare', 'Emotions'].includes(meta.group) || cls.category === 'Emergency & Medical';
    } else if (selectedFilter === 'Food & Kitchen') {
      matchesGroup = meta.group === 'Food' || cls.category === 'Food & Groceries';
    } else if (selectedFilter === 'Actions & Daily') {
      matchesGroup = ['Actions', 'Daily', 'General'].includes(meta.group);
    } else if (selectedFilter === 'Animals & Nature') {
      matchesGroup = ['Animals', 'Nature'].includes(meta.group);
    } else if (selectedFilter === 'Objects & Places') {
      matchesGroup = ['Objects', 'Places', 'Education', 'People'].includes(meta.group);
    }

    return matchesSearch && matchesHand && matchesGroup;
  });
}