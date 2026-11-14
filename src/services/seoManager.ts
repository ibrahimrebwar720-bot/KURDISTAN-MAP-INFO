/**
 * Dynamic SEO, OpenGraph, Twitter Card & Schema.org JSON-LD Manager
 * Ensures every historical place, principality, era, and province in Kurdistan
 * exposes rich structured metadata for Google Search and Social Media previews.
 */

import { ERAS, FactItem } from '../data/kurdishHistoryData';
import {
  KURDISTAN_PROVINCES,
  ProvinceItem,
  matchFactToProvince,
} from '../data/kurdishProvincesData';
import { getFactYearSpan, formatKurdishYearRange } from '../utils/yearUtils';
import type { AppLanguage } from '../context/LanguageContext';

const SITE_NAME = 'Kurdish Historical Map & Encyclopedia';
const BRAND_SHORT_CKB = 'نەخشەی مێژوویی کوردستان';
const BRAND_SHORT_EN = 'Kurdistan Historical Map';
const DEFAULT_TITLE_CKB = 'نەخشەی مێژوویی کوردستان | Kurdish Historical Map';
const DEFAULT_TITLE_EN = 'Kurdistan Historical Map & Encyclopedia | kurdistan info map';
const DEFAULT_DESCRIPTION_CKB =
  'گەڕان و دۆزینەوەی مێژووی میرنشینەکان، شارستانیەتە دێرینەکان، قەڵا و شارەکانی هەر چوار پارچەی کوردستان لەسەر نەخشەیەکی کارلێککاری ورد.';
const DEFAULT_DESCRIPTION_EN =
  'Explore the interactive historical map and encyclopedia of Kurdish empires, principalities, ancient Zagros civilizations, citadels, and scholars across Kurdistan.';
const DEFAULT_IMAGE_PATH = '/kimlogo.png';
const DYNAMIC_JSONLD_ID = 'dynamic-seo-jsonld';

function upsertMeta(attr: 'name' | 'property', key: string, content: string): void {
  if (typeof document === 'undefined') return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(url: string): void {
  if (typeof document === 'undefined') return;
  let link = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function upsertJsonLd(data: Record<string, unknown>): void {
  if (typeof document === 'undefined') return;
  let script = document.getElementById(DYNAMIC_JSONLD_ID) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = DYNAMIC_JSONLD_ID;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function toAbsoluteUrl(pathOrUrl?: string): string {
  if (typeof window === 'undefined') return pathOrUrl || '';
  if (!pathOrUrl) return `${window.location.origin}${DEFAULT_IMAGE_PATH}`;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${window.location.origin}${normalized}`;
}

function truncateText(text: string, maxLen: number): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return `${clean.slice(0, maxLen - 1).trim()}…`;
}

export interface DynamicSeoContext {
  detailFact?: FactItem | null;
  selectedProvinceId?: string;
  activeView: 'hero' | 'map' | 'journey' | 'gallery' | 'menu' | 'tour';
  facts: FactItem[];
  language?: AppLanguage;
}

export function updateDynamicSeo(ctx: DynamicSeoContext): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const lang: AppLanguage = ctx.language || 'ckb';
  const isEn = lang === 'en';
  const brandShort = isEn ? BRAND_SHORT_EN : BRAND_SHORT_CKB;
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  const langSuffix = isEn ? '&lang=en' : '';
  const homeCanonical = isEn ? `${baseUrl}?lang=en` : baseUrl;
  const defaultImageUrl = toAbsoluteUrl(DEFAULT_IMAGE_PATH);

  upsertMeta('property', 'og:locale', isEn ? 'en_US' : 'ckb_IQ');

  // 1. Specific Historical Place / Principality / Event Detail View
  if (ctx.detailFact) {
    const fact = ctx.detailFact;
    const matchedProvince = matchFactToProvince(fact, lang);
    const span = getFactYearSpan(fact, lang);
    const yearLabel =
      fact.year ||
      fact.century ||
      (span ? span.label || formatKurdishYearRange(span.startYear, span.endYear, lang) : '') ||
      fact.eraPeriod;

    const provinceLabel = matchedProvince ? matchedProvince.name : fact.region || (isEn ? 'Kurdistan' : 'کوردستان');
    const partLabel = matchedProvince?.partName || (isEn ? 'Kurdistan' : 'کوردستان');
    const eraInfo = ERAS.find((e) => e.id === fact.eraId);
    const eraTitle = eraInfo ? (isEn ? eraInfo.titleEn : eraInfo.title) : fact.eraName;
    const eraRange = eraInfo ? (isEn ? eraInfo.rangeEn : eraInfo.range) : fact.eraPeriod;

    const title = yearLabel
      ? `${fact.name} (${yearLabel}) | ${brandShort}`
      : `${fact.name} | ${brandShort}`;

    const rawDesc = isEn
      ? fact.fullText || fact.desc
        ? `${fact.name} in ${provinceLabel} (${partLabel})${yearLabel ? ` – ${yearLabel}` : ''}: ${
            fact.desc || fact.fullText
          }`
        : `${fact.name} — Historical and geographical entry for ${provinceLabel} on the Kurdistan Historical Map.`
      : fact.fullText || fact.desc
      ? `${fact.name} لە ${provinceLabel} (${partLabel})${yearLabel ? ` - ${yearLabel}` : ''}: ${
          fact.desc || fact.fullText
        }`
      : `${fact.name} — تۆماری مێژوویی و جوگرافی لە ${provinceLabel} لەسەر نەخشەی مێژوویی کوردستان.`;

    const description = truncateText(rawDesc, 158);
    const canonicalUrl = `${baseUrl}?topic=${fact.id}${langSuffix}`;
    const imageUrl = fact.imageUrl ? toAbsoluteUrl(fact.imageUrl) : defaultImageUrl;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:type', 'article');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', imageUrl);
    upsertMeta('property', 'og:site_name', SITE_NAME);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', imageUrl);
    upsertCanonical(canonicalUrl);

    const placeNode: Record<string, unknown> = {
      '@type': 'Place',
      '@id': `${canonicalUrl}#place`,
      name: fact.name,
      description: truncateText(fact.desc || fact.fullText || fact.name, 260),
      url: canonicalUrl,
      image: imageUrl,
      containedInPlace: {
        '@type': 'AdministrativeArea',
        name: `${provinceLabel} - ${partLabel}`,
      },
    };

    if (Number.isFinite(fact.lat) && Number.isFinite(fact.lng) && !(fact.lat === 0 && fact.lng === 0)) {
      placeNode.geo = {
        '@type': 'GeoCoordinates',
        latitude: fact.lat,
        longitude: fact.lng,
      };
    }

    const articleNode: Record<string, unknown> = {
      '@type': 'Article',
      '@id': `${canonicalUrl}#article`,
      headline: fact.name,
      name: fact.name,
      description,
      inLanguage: lang,
      image: imageUrl,
      mainEntityOfPage: canonicalUrl,
      about: { '@id': `${canonicalUrl}#place` },
      spatialCoverage: { '@id': `${canonicalUrl}#place` },
      keywords: [
        fact.name,
        provinceLabel,
        partLabel,
        eraTitle,
        fact.tag,
        isEn ? 'History of Kurdistan' : 'مێژووی کوردستان',
      ]
        .filter(Boolean)
        .join(', '),
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: {
          '@type': 'ImageObject',
          url: defaultImageUrl,
        },
      },
    };

    if (yearLabel) {
      articleNode.temporalCoverage = yearLabel;
    }
    if (eraInfo) {
      articleNode.isPartOf = {
        '@type': 'CreativeWorkSeries',
        name: `${eraTitle} (${eraRange})`,
      };
    }

    const breadcrumbItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: brandShort,
        item: homeCanonical,
      },
      ...(eraInfo
        ? [
            {
              '@type': 'ListItem',
              position: 2,
              name: eraTitle,
              item: `${baseUrl}?view=journey${langSuffix}`,
            },
          ]
        : []),
      ...(matchedProvince
        ? [
            {
              '@type': 'ListItem',
              position: eraInfo ? 3 : 2,
              name: matchedProvince.name,
              item: `${baseUrl}?view=map&province=${encodeURIComponent(matchedProvince.id)}${langSuffix}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: (eraInfo ? 1 : 0) + (matchedProvince ? 1 : 0) + 2,
        name: fact.name,
        item: canonicalUrl,
      },
    ];

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        articleNode,
        placeNode,
        {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbItems,
        },
      ],
    });
    return;
  }

  // 2. Province-Filtered View
  const rawProv: ProvinceItem | undefined =
    ctx.selectedProvinceId && ctx.selectedProvinceId !== 'all'
      ? KURDISTAN_PROVINCES.find((p) => p.id === ctx.selectedProvinceId)
      : undefined;

  if (rawProv) {
    const provName = isEn ? rawProv.nameEn || rawProv.name : rawProv.name;
    const partName = isEn ? rawProv.partNameEn || rawProv.partName : rawProv.partName;
    const provFacts = ctx.facts.filter((f) => matchFactToProvince(f, lang)?.id === rawProv.id);
    const title = isEn
      ? `History of ${provName} (${partName}) | ${brandShort}`
      : `مێژووی ${provName} (${partName}) | ${brandShort}`;
    const sampleNames = provFacts
      .slice(0, 3)
      .map((f) => f.name)
      .join(isEn ? ', ' : '، ');
    const description = truncateText(
      isEn
        ? provFacts.length > 0
          ? `Discover ${provFacts.length} historical sites, principalities, and events in ${provName} (${partName}) including ${sampleNames}.`
          : `Interactive historical map and boundaries of ${provName} province in ${partName} on the Kurdistan Historical Encyclopedia.`
        : provFacts.length > 0
        ? `دۆزینەوەی ${provFacts.length} شوێن، میرنشین و ڕووداوی مێژوویی لە پارێزگای ${provName} (${partName}) وەک ${sampleNames}.`
        : `نەخشەی مێژوویی و سنووری جوگرافی پارێزگای ${provName} لە ${partName} لەسەر ئینسایکلۆپیدیای مێژووی کوردستان.`,
      158
    );
    const canonicalUrl = `${baseUrl}?view=map&province=${encodeURIComponent(rawProv.id)}${langSuffix}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:type', 'website');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', defaultImageUrl);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', defaultImageUrl);
    upsertCanonical(canonicalUrl);

    upsertJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'AdministrativeArea',
          '@id': `${canonicalUrl}#province`,
          name: provName,
          alternateName: rawProv.aliases.slice(0, 6),
          description,
          url: canonicalUrl,
          geo: {
            '@type': 'GeoCoordinates',
            latitude: rawProv.center[0],
            longitude: rawProv.center[1],
          },
          containedInPlace: {
            '@type': 'Place',
            name: partName,
          },
        },
        ...(provFacts.length > 0
          ? [
              {
                '@type': 'ItemList',
                name: isEn
                  ? `Historical Sites & Principalities of ${provName}`
                  : `شوێن و میرنشینە مێژووییەکانی ${provName}`,
                numberOfItems: provFacts.length,
                itemListElement: provFacts.slice(0, 25).map((f, idx) => ({
                  '@type': 'ListItem',
                  position: idx + 1,
                  name: f.name,
                  url: `${baseUrl}?topic=${f.id}${langSuffix}`,
                })),
              },
            ]
          : []),
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: brandShort, item: homeCanonical },
            {
              '@type': 'ListItem',
              position: 2,
              name: partName,
              item: `${baseUrl}?view=map${langSuffix}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: provName,
              item: canonicalUrl,
            },
          ],
        },
      ],
    });
    return;
  }

  // 3. View-level SEO (Journey / Gallery / Menu / Map / Hero)
  let title = isEn ? DEFAULT_TITLE_EN : DEFAULT_TITLE_CKB;
  let description = isEn ? DEFAULT_DESCRIPTION_EN : DEFAULT_DESCRIPTION_CKB;
  let canonicalUrl = homeCanonical;
  let extraGraph: Record<string, unknown>[] = [];

  if (ctx.activeView === 'journey') {
    title = isEn
      ? `Historical Journey & Eras of Kurdistan | ${brandShort}`
      : `گەشتی مێژوویی و سەردەمەکانی کوردستان | ${brandShort}`;
    description = isEn
      ? 'Travel through the 5 historical eras of Kurdistan from ancient Zagros civilizations and the Median Empire to Kurdish emirates and modern republics.'
      : 'گەشت بەناو ٥ سەردەمی مێژوویی کوردستاندا لە شارستانیەتی دێرینی زاگرۆس و ئیمپراتۆریەتی مادەوە تا میرنشینەکان و کۆمارە مۆدێرنەکان.';
    canonicalUrl = `${baseUrl}?view=journey${langSuffix}`;
    extraGraph = [
      {
        '@type': 'ItemList',
        name: isEn ? 'Historical Eras of Kurdistan' : 'سەردەمە مێژووییەکانی کوردستان',
        numberOfItems: ERAS.length,
        itemListElement: ERAS.map((era, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'HistoricalEvent',
            name: isEn ? era.titleEn : era.title,
            description: isEn ? era.descriptionEn : era.description,
            temporalCoverage: isEn ? era.rangeEn : era.range,
          },
        })),
      },
    ];
  } else if (ctx.activeView === 'gallery') {
    title = isEn
      ? `Historical Photo & Map Archive | ${brandShort}`
      : `گەلەری وێنە و نەخشە مێژووییەکان | ${brandShort}`;
    description = isEn
      ? 'Curated archive of historic citadels, archaeological landmarks, leaders, poets, and Kurdish principalities across all four parts of Kurdistan.'
      : 'ئەرشیف و گەلەری وێنەی قەڵا، شوێنەوار، سەرکردە، شاعیر و میرنشینە مێژووییەکانی هەر چوار پارچەی کوردستان.';
    canonicalUrl = `${baseUrl}?view=gallery${langSuffix}`;
    extraGraph = [
      {
        '@type': 'ImageGallery',
        name: isEn ? 'Kurdistan Historical Gallery' : 'گەلەری مێژوویی کوردستان',
        description,
        url: canonicalUrl,
      },
    ];
  } else if (ctx.activeView === 'menu') {
    title = isEn
      ? `Directory of Kurdish Principalities & Cities | ${brandShort}`
      : `پێڕستی میرنشین و شارەکانی کوردستان | ${brandShort}`;
    description = isEn
      ? 'Complete encyclopedia directory of Kurdish cities, citadels, principalities, civilizations, and all 47 provinces across South, North, East, and West Kurdistan.'
      : 'پێڕستی تەواوی شار، قەڵا، میرنشین، شارستانیەت و ٤٧ پارێزگای کوردستان لە باشوور، باکوور، ڕۆژهەڵات و ڕۆژئاوا.';
    canonicalUrl = `${baseUrl}?view=menu${langSuffix}`;
    extraGraph = [
      {
        '@type': 'CollectionPage',
        name: isEn ? 'Kurdistan Historical Encyclopedia Directory' : 'پێڕستی ئینسایکلۆپیدیای مێژووی کوردستان',
        description,
        url: canonicalUrl,
        numberOfItems: ctx.facts.length,
      },
    ];
  } else if (ctx.activeView === 'map' || ctx.activeView === 'tour') {
    title = isEn
      ? `Interactive Historical Map of Kurdistan | ${brandShort}`
      : `نەخشەی کارلێککاری کوردستان | ${brandShort}`;
    description = isEn
      ? 'Explore Kurdish principalities, citadels, ancient civilizations, and all 47 Kurdistan province boundaries on an interactive historical map.'
      : 'بینینی سەرجەم میرنشینەکان، قەڵا مێژووییەکان، شارەکان و سنووری ٤٧ پارێزگای کوردستان بە کوردی لەسەر نەخشەی کارلێککار.';
    canonicalUrl = `${baseUrl}?view=map${langSuffix}`;
  }

  document.title = title;
  upsertMeta('name', 'description', description);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:description', description);
  upsertMeta('property', 'og:url', canonicalUrl);
  upsertMeta('property', 'og:image', defaultImageUrl);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title);
  upsertMeta('name', 'twitter:description', description);
  upsertMeta('name', 'twitter:image', defaultImageUrl);
  upsertCanonical(canonicalUrl);

  upsertJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: SITE_NAME,
        alternateName: 'kurdistan info map',
        applicationCategory: 'EducationalApplication',
        operatingSystem: 'All',
        inLanguage: lang,
        url: canonicalUrl,
        description,
        image: defaultImageUrl,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
      ...extraGraph,
    ],
  });
}
