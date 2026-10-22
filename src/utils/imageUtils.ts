/**
 * Universal Image URL normalization and resolvers
 * Supports Google Drive, Dropbox, OneDrive, Wikipedia, Wikimedia Commons, Imgur, and Image Hosts
 */

export interface ResolvedLinkInfo {
  resolvedUrl: string;
  sourceType:
    | 'wikipedia'
    | 'wikimedia'
    | 'gdrive'
    | 'dropbox'
    | 'onedrive'
    | 'mega'
    | 'imgur'
    | 'imgbb'
    | 'postimages'
    | 'direct'
    | 'other';
  label: string;
  isConverted: boolean;
  warningNote?: string;
}

/**
 * Universal Image URL Resolver:
 * Resolves cloud drive and encyclopedic links into direct streaming CDN image URLs:
 * - Google Drive: converts share link to high-speed lh3.googleusercontent.com/d/ ID link
 * - Dropbox: converts view link to direct streaming raw=1 link
 * - Wikipedia / Wikimedia: converts viewer page links to direct Special:FilePath CDN links
 * - Imgur: converts viewer page to direct .jpg CDN link
 */
export function resolveImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';

  // Reject bulky base64 data URLs to protect local storage and memory
  if (trimmed.startsWith('data:')) {
    return '';
  }

  try {
    let decoded = trimmed;
    try {
      decoded = decodeURI(trimmed);
    } catch {
      // ignore URI decode error
    }

    // 1. Wikipedia / Wikimedia Media Viewer hash links:
    // e.g. https://ckb.wikipedia.org/wiki/سمکۆی_شکاک#/media/پەڕگە:Simko_Sikaki.jpg
    const mediaViewerMatch = decoded.match(
      /#\/media\/(?:File|پەڕگە|ملف|پرونده|Dosya|Fichier|Datei|Wêne|Image|Файл):?\s*([^?#]+)/i
    );
    if (mediaViewerMatch) {
      const rawFileName = mediaViewerMatch[1].trim().replace(/^_+|_+$/g, '');
      const domainMatch = decoded.match(/https?:\/\/([^/]+)/i);
      const domain = domainMatch ? domainMatch[1] : 'commons.wikimedia.org';
      return `https://${domain}/wiki/Special:FilePath/${encodeURIComponent(rawFileName)}`;
    }

    // 2. Wikipedia / Wikimedia File page links:
    // e.g. https://commons.wikimedia.org/wiki/File:Simko_Sikaki.jpg
    const filePageMatch = decoded.match(
      /\/wiki\/(?:File|پەڕگە|ملف|پرونده|Dosya|Fichier|Datei|Wêne|Image|Файл):([^?#/]+)/i
    );
    if (filePageMatch) {
      const rawFileName = filePageMatch[1].trim();
      const domainMatch = decoded.match(/https?:\/\/([^/]+)/i);
      const domain = domainMatch ? domainMatch[1] : 'commons.wikimedia.org';
      return `https://${domain}/wiki/Special:FilePath/${encodeURIComponent(rawFileName)}`;
    }

    // 3. Google Drive public share links:
    // e.g. https://drive.google.com/file/d/1a2b3c4d5e/view?usp=sharing
    // or https://drive.google.com/open?id=1a2b3c4d5e
    // or https://drive.google.com/uc?id=1a2b3c4d5e
    const gDriveMatch = trimmed.match(
      /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=view&)?id=)([a-zA-Z0-9_-]+)/i
    );
    if (gDriveMatch) {
      // Google high-speed direct image rendering CDN
      return `https://lh3.googleusercontent.com/d/${gDriveMatch[1]}`;
    }

    // 4. Dropbox share link (convert ?dl=0 to ?raw=1 or append ?raw=1)
    if (trimmed.includes('dropbox.com')) {
      if (trimmed.includes('dl=0')) {
        return trimmed.replace('dl=0', 'raw=1');
      }
      if (!trimmed.includes('raw=1')) {
        return trimmed.includes('?') ? `${trimmed}&raw=1` : `${trimmed}?raw=1`;
      }
      return trimmed;
    }

    // 5. OneDrive embed / download link
    // e.g. https://1drv.ms/i/s!xyz or onedrive.live.com
    if (trimmed.includes('1drv.ms') || trimmed.includes('onedrive.live.com')) {
      if (trimmed.includes('1drv.ms') && !trimmed.includes('download=1')) {
        return trimmed;
      }
    }

    // 6. Imgur direct image resolver (e.g. https://imgur.com/aBcDeFg -> https://i.imgur.com/aBcDeFg.jpg)
    const imgurMatch = trimmed.match(/^https?:\/\/(?:www\.)?imgur\.com\/([a-zA-Z0-9]+)$/i);
    if (imgurMatch && !['a', 'gallery', 't'].includes(imgurMatch[1])) {
      return `https://i.imgur.com/${imgurMatch[1]}.jpg`;
    }

    return trimmed;
  } catch {
    return trimmed;
  }
}

/**
 * Inspects a link and returns source metadata, conversion status, and drive guidance
 */
export function getLinkTypeInfo(url: string): ResolvedLinkInfo {
  const resolved = resolveImageUrl(url);
  const isConverted = Boolean(url && resolved && url.trim() !== resolved);

  if (!url || !url.trim()) {
    return {
      resolvedUrl: '',
      sourceType: 'other',
      label: 'بەتاڵ',
      isConverted: false,
    };
  }

  const lower = url.toLowerCase();

  // MEGA Links detection & guidance
  if (lower.includes('mega.nz') || lower.includes('mega.io')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'mega',
      label: 'MEGA Cloud',
      isConverted: false,
      warningNote:
        'سێرڤەری MEGA فایلەکانی بە شێوەی کۆدکراوی تایبەت (End-to-End Encrypted) هەڵدەگرێت، بۆیە ڕێگە بە پەخشی ڕاستەوخۆ لەسەر وێب نادات. پێشنیار دەکرێت ئەم وێنەیە لە Google Drive یان ماڵپەڕی ImgBB دابنێیت تا بە خێرایی ڕاستەوخۆ پەخش ببێت.',
    };
  }

  // Google Drive
  if (lower.includes('drive.google.com') || lower.includes('googleusercontent.com')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'gdrive',
      label: 'گووگڵ درایڤ (Google Drive)',
      isConverted,
    };
  }

  // Dropbox
  if (lower.includes('dropbox.com')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'dropbox',
      label: 'دراپبۆکس (Dropbox)',
      isConverted,
    };
  }

  // OneDrive
  if (lower.includes('1drv.ms') || lower.includes('onedrive.live.com')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'onedrive',
      label: 'وەن درایڤ (OneDrive)',
      isConverted,
    };
  }

  // Wikipedia
  if (lower.includes('wikipedia.org')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'wikipedia',
      label: 'ویکیپێدیا (Wikipedia)',
      isConverted,
    };
  }

  // Wikimedia
  if (lower.includes('wikimedia.org')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'wikimedia',
      label: 'ویکیمێدیا (Wikimedia Commons)',
      isConverted,
    };
  }

  // ImgBB
  if (lower.includes('ibb.co')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'imgbb',
      label: 'ImgBB',
      isConverted,
    };
  }

  // Postimages
  if (lower.includes('postimg.cc') || lower.includes('postimages.org')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'postimages',
      label: 'Postimages',
      isConverted,
    };
  }

  // Imgur
  if (lower.includes('imgur.com')) {
    return {
      resolvedUrl: resolved,
      sourceType: 'imgur',
      label: 'Imgur',
      isConverted,
    };
  }

  // Direct image file URL
  if (/\.(jpg|jpeg|png|webp|svg|gif|avif)($|\?)/i.test(lower)) {
    return {
      resolvedUrl: resolved,
      sourceType: 'direct',
      label: 'بەستەری ڕاستەوخۆی وێنە',
      isConverted,
    };
  }

  return {
    resolvedUrl: resolved,
    sourceType: 'other',
    label: 'هۆست ئیمەیج / وێب',
    isConverted,
  };
}
