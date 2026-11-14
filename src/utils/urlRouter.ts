/**
 * URL Routing & Deep-Linking Service for Kurdish History Platform
 * 
 * Provides classic website direct URLs, deep-linking, browser history (back/forward),
 * and shareable links for topics, views, and categories.
 */

import { FactItem } from '../data/kurdishHistoryData';
import type { AppLanguage } from '../context/LanguageContext';

export interface UrlState {
  topicId: number | null;
  view: 'hero' | 'map' | 'journey' | 'gallery' | 'menu' | 'settings' | 'tour' | null;
  category: string | null;
  province: string | null;
  year: number | 'all' | null;
  lang: AppLanguage | null;
}

/**
 * Parse current window location to extract deep-link parameters
 */
export function parseCurrentUrl(): UrlState {
  if (typeof window === 'undefined') {
    return { topicId: null, view: null, category: null, province: null, year: null, lang: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';
  const pathname = window.location.pathname || '';

  let rawTopic = searchParams.get('topic') || searchParams.get('fact') || searchParams.get('id');

  if (!rawTopic) {
    const pathMatch = pathname.match(/\/(?:topic|fact)\/([0-9a-zA-Z_-]+)/);
    if (pathMatch) {
      rawTopic = pathMatch[1];
    }
  }

  if (!rawTopic && hash) {
    const hashMatch = hash.match(/#(?:topic|fact)[=-]([0-9a-zA-Z_-]+)/);
    if (hashMatch) {
      rawTopic = hashMatch[1];
    }
  }

  const topicId = rawTopic ? parseInt(rawTopic, 10) : null;

  const rawView = searchParams.get('view');
  let view: UrlState['view'] = null;
  if (rawView === 'map' || rawView === 'journey' || rawView === 'gallery' || rawView === 'menu' || rawView === 'settings' || rawView === 'tour') {
    view = rawView;
  } else if (rawView === 'hero' || rawView === 'home') {
    view = 'hero';
  }

  if (topicId && !view) {
    view = 'map';
  }

  const category = searchParams.get('category') || null;
  const province = searchParams.get('province') || null;
  if (province && !view) {
    view = 'map';
  }
  const rawYear = searchParams.get('year');
  const year = rawYear ? (rawYear === 'all' ? 'all' : parseInt(rawYear, 10)) : null;

  const rawLang = searchParams.get('lang');
  const lang: AppLanguage | null = rawLang === 'en' || rawLang === 'ckb' ? rawLang : null;

  return {
    topicId: Number.isFinite(topicId) ? topicId : null,
    view,
    category,
    province,
    year,
    lang,
  };
}

/**
 * Build a canonical shareable URL for a given topic
 */
export function getShareableTopicUrl(topicId: number, lang: AppLanguage = 'ckb'): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  url.searchParams.set('topic', String(topicId));
  if (lang === 'en') {
    url.searchParams.set('lang', 'en');
  }
  return url.toString();
}

/**
 * Build a canonical URL for a specific view
 */
export function getShareableViewUrl(
  view: 'hero' | 'map' | 'journey' | 'gallery' | 'menu',
  lang: AppLanguage = 'ckb'
): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  if (view !== 'hero') {
    url.searchParams.set('view', view);
  }
  if (lang === 'en') {
    url.searchParams.set('lang', 'en');
  }
  return url.toString();
}

/**
 * Synchronize the browser URL address bar and document title
 */
export function updateBrowserUrl(
  options: {
    topicId?: number | null;
    view?: 'hero' | 'map' | 'journey' | 'gallery' | 'menu' | 'settings' | 'tour' | null;
    province?: string | null;
    factName?: string;
    lang?: AppLanguage;
    replace?: boolean;
  }
): void {
  if (typeof window === 'undefined') return;

  const currentUrl = new URL(window.location.href);

  if (typeof options.topicId === 'number' && Number.isFinite(options.topicId)) {
    currentUrl.searchParams.set('topic', String(options.topicId));
    currentUrl.searchParams.delete('fact');
    currentUrl.searchParams.delete('id');
  } else if (options.topicId === null) {
    currentUrl.searchParams.delete('topic');
    currentUrl.searchParams.delete('fact');
    currentUrl.searchParams.delete('id');
  }

  if (options.view) {
    if (options.view === 'hero') {
      currentUrl.searchParams.delete('view');
    } else {
      currentUrl.searchParams.set('view', options.view);
    }
  } else if (options.view === null) {
    currentUrl.searchParams.delete('view');
  }

  if (options.province && options.province !== 'all') {
    currentUrl.searchParams.set('province', options.province);
  } else if (options.province === null || options.province === 'all') {
    currentUrl.searchParams.delete('province');
  }

  if (options.lang === 'en') {
    currentUrl.searchParams.set('lang', 'en');
  } else if (options.lang === 'ckb') {
    currentUrl.searchParams.delete('lang');
  }

  if (window.location.hash.startsWith('#topic') || window.location.hash.startsWith('#fact')) {
    currentUrl.hash = '';
  }

  const targetPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (targetPath !== currentPath) {
    if (options.replace) {
      window.history.replaceState({ topicId: options.topicId, view: options.view, province: options.province }, '', targetPath);
    } else {
      window.history.pushState({ topicId: options.topicId, view: options.view, province: options.province }, '', targetPath);
    }
  }

  const isEn = options.lang === 'en' || currentUrl.searchParams.get('lang') === 'en';
  if (isEn) {
    if (options.factName) {
      document.title = `${options.factName} | Kurdistan Historical Map`;
    } else if (options.view === 'journey') {
      document.title = `Historical Journey & Eras of Kurdistan | Kurdistan Historical Map`;
    } else if (options.view === 'gallery') {
      document.title = `Historical Photo Archive | Kurdistan Historical Map`;
    } else if (options.view === 'menu') {
      document.title = `Directory of Kurdish Principalities & Cities | Kurdistan Historical Map`;
    } else if (options.view === 'map') {
      document.title = `Interactive Historical Map of Kurdistan | kurdistan info map`;
    } else {
      document.title = `Kurdistan Historical Map & Encyclopedia | kurdistan info map`;
    }
  } else {
    if (options.factName) {
      document.title = `${options.factName} | نەخشەی مێژوویی کوردستان`;
    } else if (options.view === 'journey') {
      document.title = `گەشتی مێژوویی و سەردەمەکانی کوردستان | نەخشەی مێژوویی کوردستان`;
    } else if (options.view === 'gallery') {
      document.title = `گەلەری وێنە مێژووییەکان | نەخشەی مێژوویی کوردستان`;
    } else if (options.view === 'menu') {
      document.title = `پێڕستی میرنشین و شارەکانی کوردستان | نەخشەی مێژوویی کوردستان`;
    } else if (options.view === 'map') {
      document.title = `نەخشەی کارلێککاری کوردستان | نەخشەی مێژوویی کوردستان`;
    } else {
      document.title = `نەخشەی مێژوویی کوردستان | Kurdish Historical Map`;
    }
  }
}

/**
 * Copy shareable topic link with formatted description to clipboard
 */
export async function copyTopicToClipboard(
  fact: FactItem,
  lang: AppLanguage = 'ckb'
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  const shareUrl = getShareableTopicUrl(fact.id, lang);
  const text =
    lang === 'en'
      ? `📌 "${fact.name}"\n\n${fact.fullText || fact.desc}\n\n📍 Location: ${fact.desc}\n🔗 Direct link: ${shareUrl}\n\nSource: kurdistan info map — Kurdish Historical Map & Encyclopedia`
      : `📌 «${fact.name}»\n\n${fact.fullText || fact.desc}\n\n📍 شوێن: ${fact.desc}\n🔗 بەستەری ڕاستەوخۆ: ${shareUrl}\n\nسەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map`;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
