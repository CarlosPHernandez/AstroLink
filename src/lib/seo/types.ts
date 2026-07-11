import type { ListedExpert } from '@/lib/mentor-directory';

export type SeoPageType =
  | 'early-access'
  | 'experts-index'
  | 'expert-profile'
  | 'join-expert'
  | 'press'
  | 'privacy';

export type BuildPageMetadataInput =
  | { pageType: 'early-access' }
  | { pageType: 'experts-index' }
  | { pageType: 'press' }
  | { pageType: 'privacy' }
  | { pageType: 'expert-profile'; expert: ListedExpert }
  | { pageType: 'join-expert'; expert: ListedExpert };