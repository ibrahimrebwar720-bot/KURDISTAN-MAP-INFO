import { FactItem } from '../data/kurdishHistoryData';

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  color: string;
  isCustom?: boolean;
}

export const ADMIN_SECRET_CODE = '200076';

export const DEFAULT_COLLECTIONS: CollectionItem[] = [
  {
    id: 'all',
    name: 'هەموو دەسەڵاتەکان',
    description: 'تەواوی دەسەڵات، میرنشین، وەزیران و شوێنە مێژووییەکان',
    color: '#6366f1',
    isCustom: false,
  },
  {
    id: 'powers',
    name: 'دەسەڵات و میرنشین',
    description: 'ئیمپراتۆریەت، میرنشین و دەسەڵاتە فەرمانڕەواکان',
    color: '#3b82f6',
    isCustom: false,
  },
  {
    id: 'ministers',
    name: 'وەزیرەکان',
    description: 'وەزیران، ڕاوێژکاران و کەسایەتییە دیارەکانی بەڕێوەبردن',
    color: '#06b6d4',
    isCustom: false,
  },
  {
    id: 'officials',
    name: 'کاربەدەستان',
    description: 'کاربەدەستان، سەرکردە ئیدارییەکان و فەرمانڕەوایان',
    color: '#f97316',
    isCustom: false,
  },
  {
    id: 'scholars',
    name: 'زانایان',
    description: 'زانایان، فەیلەسوفان، بیرمەندان و مێژوونووسانی کورد',
    color: '#10b981',
    isCustom: false,
  },
  {
    id: 'rulers',
    name: 'دەسەڵاتدار و پاشا',
    description: 'پاشاکان، ئەتابەگەکان و فەرمانڕەوایانی دیار',
    color: '#eab308',
    isCustom: false,
  },
  {
    id: 'figures',
    name: 'کەسایەتی و پێشەوا',
    description: 'ڕابەران و کەسایەتییە کاریگەرە مێژووییەکان',
    color: '#ec4899',
    isCustom: false,
  },
  {
    id: 'monuments',
    name: 'شوێنەوار و قەڵا',
    description: 'قەڵا مێژووییەکان، پایتەخت و پاشماوە شوێنەوارییەکان',
    color: '#8b5cf6',
    isCustom: false,
  },
  {
    id: 'battles',
    name: 'ڕووداو و جەنگەکان',
    description: 'شەڕ و پەیماننامە چارەنووسسازەکانی مێژوو',
    color: '#ef4444',
    isCustom: false,
  },
];
