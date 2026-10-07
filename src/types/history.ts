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
    name: 'هەموو وێستگەکان',
    description: 'تەواوی ٣٥٠ دەسەڵات، میرنشین و وێستگە مێژووییەکان',
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
    id: 'scholars',
    name: 'زانا و نووسەر',
    description: 'زانایان، فەیلەسوفان و مێژوونووسانی کورد',
    color: '#10b981',
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
