import { BookOpenIcon, GlobeIcon, HistoryIcon, ListOrderedIcon, VideoIcon, type LucideIcon } from 'lucide-react';
import type { View } from '../types/voxis';

export interface NavItem {
  view: View;
  label: string;
  icon: LucideIcon;
  keywords: string;
}

export const primaryNav: NavItem[] = [
  { view: 'translator', label: 'Live Translator', icon: VideoIcon, keywords: 'camera live recognition translate isl asl typist' },
  { view: 'guide', label: 'Gesture Guide', icon: BookOpenIcon, keywords: 'signs lexicon learn 3d practice vocabulary' },
  { view: 'builder', label: 'Sentence Builder', icon: ListOrderedIcon, keywords: 'sentence sequence combination demo try' },
  { view: 'multilingual', label: 'Multilingual Studio', icon: GlobeIcon, keywords: 'multilingual regional speech translate audio' }
];


export const historyNav: NavItem = {
  view: 'history',
  label: 'Conversation history',
  icon: HistoryIcon,
  keywords: 'history transcript export recent'
};