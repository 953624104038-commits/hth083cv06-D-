import type { SignMetadata } from '../types/voxis';

// Ported verbatim from VocabularyModal ISL_METADATA_MAP (used for filter tabs).
export const islMetadataMap: Record<string, SignMetadata> = {
  Bear: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Break: { hands: 2, motion: 'dynamic', group: 'Actions' },
  Brinjal: { hands: 2, motion: 'dynamic', group: 'Food' },
  Budget: { hands: 2, motion: 'dynamic', group: 'Finance' },
  Busy: { hands: 2, motion: 'dynamic', group: 'Daily' },
  Cabbage: { hands: 2, motion: 'dynamic', group: 'Food' },
  Carrot: { hands: 1, motion: 'dynamic', group: 'Food' },
  Cauliflower: { hands: 2, motion: 'dynamic', group: 'Food' },
  Chilli: { hands: 1, motion: 'dynamic', group: 'Food' },
  Clean: { hands: 2, motion: 'dynamic', group: 'Actions' },
  Close: { hands: 2, motion: 'dynamic', group: 'Actions' },
  Come: { hands: 1, motion: 'dynamic', group: 'Actions' },
  Cook: { hands: 2, motion: 'dynamic', group: 'Actions' },
  Crocodile: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Cry: { hands: 2, motion: 'dynamic', group: 'Emotions' },
  Cucumber: { hands: 2, motion: 'dynamic', group: 'Food' },
  Deer: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Drink: { hands: 1, motion: 'dynamic', group: 'Actions' },
  Elephant: { hands: 1, motion: 'dynamic', group: 'Animals' },
  Exam: { hands: 2, motion: 'dynamic', group: 'Education' },
  Fedup: { hands: 1, motion: 'static', group: 'Emotions' },
  Fever: { hands: 1, motion: 'static', group: 'Healthcare' },
  Giraffe: { hands: 1, motion: 'dynamic', group: 'Animals' },
  Give: { hands: 1, motion: 'dynamic', group: 'Actions' },
  'Good Morning': { hands: 2, motion: 'dynamic', group: 'Greetings' },
  'Good afternoon': { hands: 2, motion: 'dynamic', group: 'Greetings' },
  Hello: { hands: 1, motion: 'dynamic', group: 'Greetings' },
  Hug: { hands: 2, motion: 'dynamic', group: 'Emotions' },
  Injury: { hands: 1, motion: 'static', group: 'Healthcare' },
  Interview: { hands: 2, motion: 'dynamic', group: 'Work' },
  Jump: { hands: 2, motion: 'dynamic', group: 'Actions' },
  Karnataka: { hands: 2, motion: 'dynamic', group: 'Places' },
  Key: { hands: 2, motion: 'dynamic', group: 'Objects' },
  Knife: { hands: 2, motion: 'dynamic', group: 'Objects' },
  Lemon: { hands: 1, motion: 'dynamic', group: 'Food' },
  Lion: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Man: { hands: 1, motion: 'static', group: 'People' },
  Maths: { hands: 2, motion: 'dynamic', group: 'Education' },
  Maybe: { hands: 2, motion: 'dynamic', group: 'General' },
  Monkey: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Onion: { hands: 1, motion: 'dynamic', group: 'Food' },
  Peacock: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Pigeon: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Pour: { hands: 1, motion: 'dynamic', group: 'Actions' },
  Radish: { hands: 1, motion: 'dynamic', group: 'Food' },
  Sparrow: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Still: { hands: 2, motion: 'static', group: 'General' },
  Switch: { hands: 1, motion: 'dynamic', group: 'Objects' },
  Tea: { hands: 2, motion: 'dynamic', group: 'Food' },
  Temple: { hands: 2, motion: 'static', group: 'Places' },
  'Thank you': { hands: 1, motion: 'dynamic', group: 'Greetings' },
  Tiger: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Turtle: { hands: 2, motion: 'dynamic', group: 'Animals' },
  Umbrella: { hands: 2, motion: 'dynamic', group: 'Objects' },
  Uncle: { hands: 1, motion: 'dynamic', group: 'People' },
  Vegetables: { hands: 2, motion: 'dynamic', group: 'Food' },
  Volcano: { hands: 2, motion: 'dynamic', group: 'Nature' },
  'What is your Name': { hands: 2, motion: 'dynamic', group: 'Greetings' },
  Wife: { hands: 2, motion: 'dynamic', group: 'People' },
  Writer: { hands: 2, motion: 'dynamic', group: 'Work' },
  Wrong: { hands: 1, motion: 'static', group: 'General' }
};

export const quickFilterTabs = [
'All',
'Greetings & Service',
'Healthcare & Emergency',
'Food & Kitchen',
'Actions & Daily',
'Animals & Nature',
'Objects & Places'] as
const;

export type QuickFilterTab = (typeof quickFilterTabs)[number];

export const handFilters = ['All', '1 Hand', '2 Hands'] as const;
export type HandFilter = (typeof handFilters)[number];

// Solid tile colours per group — used as the card "artwork" surface.
export const groupTints: Record<string, string> = {
  Greetings: '#0f3b26',
  Finance: '#1f3440',
  Work: '#1f3440',
  Healthcare: '#4a1c24',
  Emotions: '#3b2448',
  Food: '#4a3212',
  Actions: '#133049',
  Daily: '#133049',
  General: '#2c2c2c',
  Animals: '#2d3a14',
  Nature: '#2d3a14',
  Objects: '#2b303a',
  Places: '#452f1c',
  Education: '#1d2c4d',
  People: '#3a2342'
};