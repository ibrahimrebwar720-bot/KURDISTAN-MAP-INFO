/**
 * URL Routing & Deep-Linking Service for Kurdish History Platform
 * 
 * Provides classic website direct URLs, deep-linking, browser history (back/forward),
 * and shareable links for topics, views, and categories.
 */

import { FactItem } from '../data/kurdishHistoryData';

export interface UrlState {
  topicId: number | null;
  view: 'hero' | 'map' | 'journey' | 'gallery' | 'menu' | 'settings' | 'tour' | null;
  category: string | null;
  year: number | 'all' | null;
}

/**
 * Parse current window location to extract deep-link parameters
 */
export function parseCurrentUrl(): UrlState {
  if (typeof window === 'undefined') {
    return { topicId: null, view: null, category: null, year: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hash = window.location.hash || '';
  const pathname = window.location.pathname || '';

  // 1. Topic ID extraction from query param, path or hash
  let rawTopic = searchParams.get('topic') || searchParams.get('fact') || searchParams.get('id');

  if (!rawTopic) {
    // Check path like /topic/123 or /fact/123
    const pathMatch = pathname.match(/\/(?:topic|fact)\/([0-9a-zA-Z_-]+)/);
    if (pathMatch) {
      rawTopic = pathMatch[1];
    }
  }

  if (!rawTopic && hash) {
    // Check hash like #topic=123 or #fact-123
    const hashMatch = hash.match(/#(?:topic|fact)[=-]([0-9a-zA-Z_-]+)/);
    if (hashMatch) {
      rawTopic = hashMatch[1];
    }
  }

  const topicId = rawTopic ? parseInt(rawTopic, 10) : null;

  // 2. View extraction
  const rawView = searchParams.get('view');
  let view: UrlState['view'] = null;
  if (rawView === 'map' || rawView === 'journey' || rawView === 'gallery' || rawView === 'menu' || rawView === 'settings' || rawView === 'tour') {
    view = rawView;
  } else if (rawView === 'hero' || rawView === 'home') {
    view = 'hero';
  }

  // If topic is present but no view is specified, view is inherently 'map' or detail
  if (topicId && !view) {
    view = 'map';
  }

  // 3. Category & Year
  const category = searchParams.get('category') || null;
  const rawYear = searchParams.get('year');
  const year = rawYear ? (rawYear === 'all' ? 'all' : parseInt(rawYear, 10)) : null;

  return {
    topicId: Number.isFinite(topicId) ? topicId : null,
    view,
    category,
    year,
  };
}

/**
 * Build a canonical shareable URL for a given topic
 */
export function getShareableTopicUrl(topicId: number): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  url.searchParams.set('topic', String(topicId));
  return url.toString();
}

/**
 * Build a canonical URL for a specific view
 */
export function getShareableViewUrl(view: 'hero' | 'map' | 'journey' | 'gallery' | 'menu'): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  if (view !== 'hero') {
    url.searchParams.set('view', view);
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
    factName?: string;
    replace?: boolean;
  }
): void {
  if (typeof window === 'undefined') return;

  const currentUrl = new URL(window.location.href);

  // Handle topic ID
  if (typeof options.topicId === 'number' && Number.isFinite(options.topicId)) {
    currentUrl.searchParams.set('topic', String(options.topicId));
    // Clean up temporary params
    currentUrl.searchParams.delete('fact');
    currentUrl.searchParams.delete('id');
  } else if (options.topicId === null) {
    currentUrl.searchParams.delete('topic');
    currentUrl.searchParams.delete('fact');
    currentUrl.searchParams.delete('id');
  }

  // Handle view
  if (options.view) {
    if (options.view === 'hero') {
      currentUrl.searchParams.delete('view');
    } else {
      currentUrl.searchParams.set('view', options.view);
    }
  } else if (options.view === null) {
    currentUrl.searchParams.delete('view');
  }

  // Clean empty hash if was used for routing
  if (window.location.hash.startsWith('#topic') || window.location.hash.startsWith('#fact')) {
    currentUrl.hash = '';
  }

  const targetPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;

  // Only update if URL actually changed
  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (targetPath !== currentPath) {
    if (options.replace) {
      window.history.replaceState({ topicId: options.topicId, view: options.view }, '', targetPath);
    } else {
      window.history.pushState({ topicId: options.topicId, view: options.view }, '', targetPath);
    }
  }

  // Dynamic Document Title & Meta Tag synchronization
  if (options.factName) {
    document.title = `${options.factName} | مێژووی کوردستان`;
  } else if (options.view === 'journey') {
    document.title = `گەشتی مێژوویی (پۆستەرەکان) | مێژووی کوردستان`;
  } else if (options.view === 'gallery') {
    document.title = `گەلەری وێنە مێژووییەکان | مێژووی کوردستان`;
  } else if (options.view === 'menu') {
    document.title = `پێڕستی مێژوویی و دەسەڵاتەکان | مێژووی کوردستان`;
  } else if (options.view === 'map') {
    document.title = `نەخشەی مێژووی کوردستان | Kurdistan History Map`;
  } else {
    document.title = `مێژووی کوردستان | نەخشەی مێژوویی و دەسەڵاتە دێرینەکان`;
  }
}

/**
 * Copy shareable topic link with formatted description to clipboard
 */
export async function copyTopicToClipboard(fact: FactItem): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
  const shareUrl = getShareableTopicUrl(fact.id);
  const text = `📌 «${fact.name}»\n\n${fact.fullText || fact.desc}\n\n📍 شوێن: ${fact.desc}\n🔗 بەستەری ڕاستەوخۆ: ${shareUrl}\n\nسەرچاوە: ئینسایکلۆپیدیا و نەخشەی مێژووی کوردستان`;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
