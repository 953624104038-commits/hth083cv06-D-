import type { CuratedSign, DemoCombination, DemoScenario } from '../types/voxis';

// Ported from VocabularyModal PRESET_DEMO_COMBINATIONS. Index 0 is the primary demo.
export const presetDemoCombinations: DemoCombination[] = [
{ id: 'primary', title: 'Primary Emergency Assistance Demo', signs: ['Hello', 'Need', 'Help'], description: 'Polite greeting followed by urgent request for assistance.', category: 'Emergency' },
{ id: 'polite', title: 'Polite Service Exchange', signs: ['Hello', 'Thank you'], description: 'Standard polite counter greeting and appreciation.', category: 'Greetings' },
{ id: 'injury', title: 'Medical Injury Alert', signs: ['Injury', 'Help'], description: 'Immediate alert indicating injury and requesting aid.', category: 'Medical' },
{ id: 'beverage', title: 'Hospitality & Beverage', signs: ['Drink', 'Tea', 'Thank you'], description: 'Ordering beverage at a hospitality or dining counter.', category: 'Daily Living' },
{ id: 'kitchen', title: 'Kitchen & Meal Instruction', signs: ['Clean', 'Vegetables', 'Cook'], description: 'Kitchen assistance sequence for cleaning and cooking vegetables.', category: 'Daily Living' },
{ id: 'counter', title: 'Service Counter Introduction', signs: ['Good Morning', 'What is your Name'], description: 'Official service desk introduction and greeting.', category: 'Greetings' }];


// Ported from SentenceBuilder VERIFIED_ISL_DEMO_SCENARIOS.
export const verifiedDemoScenarios: DemoScenario[] = [
{ id: 'hospitality', title: 'Hospitality / Beverage', signs: ['Hello', 'Drink', 'Tea', 'Thank you'] },
{ id: 'emergency', title: 'Emergency Medical', signs: ['Hello', 'Fever', 'Injury', 'Come'] },
{ id: 'kitchen', title: 'Kitchen & Meal', signs: ['Clean', 'Vegetables', 'Cook', 'Thank you'] },
{ id: 'heritage', title: 'Heritage & Travel', signs: ['Good afternoon', 'Temple', 'Come', 'Thank you'] },
{ id: 'counter-id', title: 'Counter Identification', signs: ['Good Morning', 'What is your Name', 'Thank you'] },
{ id: 'utensil', title: 'Utensil Request', signs: ['Give', 'Knife', 'Lemon', 'Thank you'] }];


// Ported from SentenceBuilder CURATED_DEMO_SIGNS (tap-to-append palette).
export const curatedDemoSigns: CuratedSign[] = [
{ sign: 'Hello', hindi: 'नमस्ते', hands: 1, cat: 'Greeting' },
{ sign: 'Thank you', hindi: 'धन्यवाद', hands: 1, cat: 'Politeness' },
{ sign: 'Good Morning', hindi: 'शुभ प्रभात', hands: 2, cat: 'Greeting' },
{ sign: 'Good afternoon', hindi: 'शुभ दोपहर', hands: 2, cat: 'Greeting' },
{ sign: 'Drink', hindi: 'पीना', hands: 1, cat: 'Dining' },
{ sign: 'Tea', hindi: 'चाय', hands: 2, cat: 'Dining' },
{ sign: 'Clean', hindi: 'साफ', hands: 2, cat: 'Service' },
{ sign: 'Cook', hindi: 'पकाना', hands: 2, cat: 'Daily' },
{ sign: 'Vegetables', hindi: 'सब्जियां', hands: 2, cat: 'Food' },
{ sign: 'Fever', hindi: 'बुखार', hands: 1, cat: 'Medical' },
{ sign: 'Injury', hindi: 'चोट', hands: 1, cat: 'Medical' },
{ sign: 'Come', hindi: 'आइए', hands: 1, cat: 'Direction' },
{ sign: 'Give', hindi: 'देना', hands: 1, cat: 'Service' },
{ sign: 'Temple', hindi: 'मंदिर', hands: 2, cat: 'Places' },
{ sign: 'Close', hindi: 'बंद', hands: 2, cat: 'Actions' },
{ sign: 'Switch', hindi: 'स्विच', hands: 1, cat: 'Utility' }];


export const PRIMARY_SEQUENCE = presetDemoCombinations[0].signs;