export type ThemeId =
  | 'kurdish-gold'
  | 'neon-orange-porcelain'
  | 'forest-graphite-acid-mint'
  | 'signal-violet-mist-gray'
  | 'prompt-blue-ai-green'
  | 'inkberry-peach'
  | 'clay-brown-soft-butter';

export interface ThemeDefinition {
  id: ThemeId;
  name: string; // Kurdish name
  englishName: string;
  description: string; // Kurdish aesthetic description
  primaryColor: string; // Main accent / neon / active tone
  secondaryColor: string; // Complementary / surface / porcelain tone
  primaryLabel: string;
  secondaryLabel: string;
  darkBg: string; // Dark backdrop canvas
  glowColor: string;
  activeBtnBg: string;
  activeBtnText: string;
  panelGradient: string;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'kurdish-gold': {
    id: 'kurdish-gold',
    name: 'ئاڵتوونی کوردەواری (بنەڕەتی)',
    englishName: 'Kurdish Gold & Obsidian',
    description: 'تێکەڵەی زێڕینی ڕۆژ و قەڵای دێرینی کوردستان بە شوشەی ڕەشی ئەفسووناوی',
    primaryColor: '#f59e0b',
    secondaryColor: '#fbbf24',
    primaryLabel: 'ئاڵتوونی ڕۆژ',
    secondaryLabel: 'شوشەی ئۆبیسیدیان',
    darkBg: '#030712',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    activeBtnBg: 'linear-gradient(180deg, rgba(251, 191, 36, 0.98) 0%, rgba(217, 119, 6, 0.92) 100%)',
    activeBtnText: '#060913',
    panelGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 40%, rgba(6, 11, 24, 0.78) 100%)',
  },
  'neon-orange-porcelain': {
    id: 'neon-orange-porcelain',
    name: 'پڕتەقاڵی نیۆن و پۆرسەلین',
    englishName: 'Neon Orange & Porcelain',
    description: 'تیشکی پڕتەقاڵی نیۆنی جۆشسەندوو لەگەڵ شوشەی سپی پۆرسەلینی نەرم',
    primaryColor: '#ff5f00',
    secondaryColor: '#f4f4f7',
    primaryLabel: 'پڕتەقاڵی نیۆن',
    secondaryLabel: 'پۆرسەلینی ڕوون',
    darkBg: '#0a0d14',
    glowColor: 'rgba(255, 95, 0, 0.55)',
    activeBtnBg: 'linear-gradient(180deg, #ff7a1a 0%, #d94e00 100%)',
    activeBtnText: '#ffffff',
    panelGradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, rgba(255, 95, 0, 0.09) 50%, rgba(10, 13, 20, 0.86) 100%)',
  },
  'forest-graphite-acid-mint': {
    id: 'forest-graphite-acid-mint',
    name: 'گرافایتی دارستان و نەعنای ئەسید',
    englishName: 'Forest Graphite & Acid Mint',
    description: 'قووڵایی تاریكیی دارستانی بەڕوو لەگەڵ بریقەی کارەبایی نەعنای ئەسید',
    primaryColor: '#00ff9d',
    secondaryColor: '#203328',
    primaryLabel: 'نەعنای ئەسید',
    secondaryLabel: 'گرافایتی دارستان',
    darkBg: '#06110c',
    glowColor: 'rgba(0, 255, 157, 0.55)',
    activeBtnBg: 'linear-gradient(180deg, #00ff9d 0%, #00b86e 100%)',
    activeBtnText: '#04160d',
    panelGradient: 'linear-gradient(135deg, rgba(0, 255, 157, 0.13) 0%, rgba(32, 51, 40, 0.35) 50%, rgba(6, 17, 12, 0.88) 100%)',
  },
  'signal-violet-mist-gray': {
    id: 'signal-violet-mist-gray',
    name: 'مۆری سیگناڵ و خۆڵەمێشی تەم',
    englishName: 'Signal Violet & Mist Gray',
    description: 'پەلی شینی-مۆری بەهێزی سیگناڵ لەگەڵ ڕووناکیی تەمومژی لووتکە چیاکان',
    primaryColor: '#a855f7',
    secondaryColor: '#cbd5e1',
    primaryLabel: 'مۆری سیگناڵ',
    secondaryLabel: 'خۆڵەمێشی تەم',
    darkBg: '#0c0915',
    glowColor: 'rgba(168, 85, 247, 0.52)',
    activeBtnBg: 'linear-gradient(180deg, #c084fc 0%, #9333ea 100%)',
    activeBtnText: '#ffffff',
    panelGradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(203, 213, 225, 0.08) 50%, rgba(12, 9, 21, 0.88) 100%)',
  },
  'prompt-blue-ai-green': {
    id: 'prompt-blue-ai-green',
    name: 'شینی پرۆمپت و سەوزی AI',
    englishName: 'Prompt Blue & AI Green',
    description: 'شینایی تیشکدەری زیرەک و سەوزی سایبەری داهاتوو لەسەر زەمینەی تەکنەلۆژیا',
    primaryColor: '#0084ff',
    secondaryColor: '#00f59b',
    primaryLabel: 'شینی پرۆمپت',
    secondaryLabel: 'سەوزی AI',
    darkBg: '#050d18',
    glowColor: 'rgba(0, 132, 255, 0.52)',
    activeBtnBg: 'linear-gradient(180deg, #0084ff 0%, #00f59b 100%)',
    activeBtnText: '#021020',
    panelGradient: 'linear-gradient(135deg, rgba(0, 132, 255, 0.15) 0%, rgba(0, 245, 155, 0.10) 50%, rgba(5, 13, 24, 0.88) 100%)',
  },
  'inkberry-peach': {
    id: 'inkberry-peach',
    name: 'ئینکبێری و قۆخ',
    englishName: 'Inkberry & Peach',
    description: 'شەراب و مەرەکەبی ڕەشی ئینکبێری لەگەڵ گەرمیی گوڵاڵە و قۆخی بەهارە',
    primaryColor: '#ff9371',
    secondaryColor: '#4a154b',
    primaryLabel: 'قۆخی تیشکدەر',
    secondaryLabel: 'ئینکبێری قووڵ',
    darkBg: '#120716',
    glowColor: 'rgba(255, 147, 113, 0.52)',
    activeBtnBg: 'linear-gradient(180deg, #ffaa8e 0%, #ea580c 100%)',
    activeBtnText: '#2a0820',
    panelGradient: 'linear-gradient(135deg, rgba(255, 147, 113, 0.15) 0%, rgba(74, 21, 75, 0.35) 50%, rgba(18, 7, 22, 0.90) 100%)',
  },
  'clay-brown-soft-butter': {
    id: 'clay-brown-soft-butter',
    name: 'قاوەیی قوڕین و کەرەی نەرم',
    englishName: 'Clay Brown & Soft Butter',
    description: 'خاکی بەپیت و گڵینەی مێژوویی لەگەڵ زەردی نەرمی کەرەیی ئارامبەخش',
    primaryColor: '#fde047',
    secondaryColor: '#9a3412',
    primaryLabel: 'کەرەی نەرم',
    secondaryLabel: 'قاوەیی قوڕین',
    darkBg: '#150d09',
    glowColor: 'rgba(253, 224, 71, 0.50)',
    activeBtnBg: 'linear-gradient(180deg, #fde047 0%, #b45309 100%)',
    activeBtnText: '#261205',
    panelGradient: 'linear-gradient(135deg, rgba(254, 240, 138, 0.15) 0%, rgba(154, 52, 18, 0.30) 50%, rgba(21, 13, 9, 0.90) 100%)',
  },
};

export const THEME_LIST = Object.values(THEMES);

export type ColorMode = 'dark' | 'light';

const THEME_STORAGE_KEY = 'kurdish_history_user_theme_v1';
const COLOR_MODE_STORAGE_KEY = 'kurdish_history_color_mode_v1';

export function loadStoredColorMode(): ColorMode {
  try {
    const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY) as ColorMode | null;
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load color mode from localStorage:', e);
  }
  return 'dark';
}

export function saveStoredColorMode(mode: ColorMode): void {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode);
  } catch (e) {
    console.warn('Failed to save color mode to localStorage:', e);
  }
}

export function loadStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES[saved]) {
      return saved;
    }
  } catch (e) {
    console.warn('Failed to load theme from localStorage:', e);
  }
  return 'kurdish-gold';
}

export function saveStoredTheme(themeId: ThemeId): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (e) {
    console.warn('Failed to save theme to localStorage:', e);
  }
}

const LIGHT_MODE_ACCENTS: Record<ThemeId, { primary: string; secondary: string; glow: string }> = {
  'kurdish-gold': { primary: '#b45309', secondary: '#92400e', glow: 'rgba(180, 83, 9, 0.25)' },
  'neon-orange-porcelain': { primary: '#c2410c', secondary: '#9a3412', glow: 'rgba(194, 65, 12, 0.25)' },
  'forest-graphite-acid-mint': { primary: '#047857', secondary: '#065f46', glow: 'rgba(4, 120, 87, 0.25)' },
  'signal-violet-mist-gray': { primary: '#7e22ce', secondary: '#6b21a8', glow: 'rgba(126, 34, 206, 0.25)' },
  'prompt-blue-ai-green': { primary: '#0284c7', secondary: '#0369a1', glow: 'rgba(2, 132, 199, 0.25)' },
  'inkberry-peach': { primary: '#c2410c', secondary: '#831843', glow: 'rgba(194, 65, 12, 0.25)' },
  'clay-brown-soft-butter': { primary: '#b45309', secondary: '#78350f', glow: 'rgba(180, 83, 9, 0.25)' },
};

export function applyThemeToDom(themeId: ThemeId, colorMode: ColorMode = 'dark'): void {
  const root = document.documentElement;
  const theme = THEMES[themeId] || THEMES['kurdish-gold'];

  root.setAttribute('data-theme', themeId);
  root.setAttribute('data-color-mode', colorMode);

  if (colorMode === 'light') {
    root.classList.add('light');
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
    root.classList.remove('light');
  }

  if (colorMode === 'light') {
    const lightAccent = LIGHT_MODE_ACCENTS[themeId] || LIGHT_MODE_ACCENTS['kurdish-gold'];
    root.style.setProperty('--theme-accent', lightAccent.primary);
    root.style.setProperty('--theme-accent-light', lightAccent.secondary);
    root.style.setProperty('--theme-accent-dark', '#78350f');
    root.style.setProperty('--theme-secondary', lightAccent.secondary);
    root.style.setProperty('--theme-accent-glow', lightAccent.glow);
    root.style.setProperty('--theme-accent-soft', 'rgba(180, 83, 9, 0.14)');
    root.style.setProperty('--theme-border-accent', 'rgba(180, 83, 9, 0.45)');

    // Soothing, elegant Nordic parchment tone (not harsh blinding glare)
    root.style.setProperty('--theme-bg', '#f4f3ef');
    root.style.setProperty('--theme-surface', '#ffffff');
    root.style.setProperty('--theme-text-primary', '#090d16');
    root.style.setProperty('--theme-text-secondary', '#1e293b');
    root.style.setProperty('--theme-text-muted', '#334155');
    root.style.setProperty('--theme-border', 'rgba(15, 23, 42, 0.12)');
    root.style.setProperty(
      '--theme-panel-gradient',
      'linear-gradient(135deg, #ffffff 0%, #faf8f5 100%)'
    );
    root.style.setProperty('--theme-btn-active-bg', 'linear-gradient(180deg, #d97706 0%, #b45309 100%)');
    root.style.setProperty('--theme-btn-active-text', '#ffffff');
  } else {
    root.style.setProperty('--theme-accent', theme.primaryColor);
    root.style.setProperty('--theme-accent-light', theme.secondaryColor);
    root.style.setProperty('--theme-secondary', theme.secondaryColor);
    root.style.setProperty('--theme-accent-glow', theme.glowColor);

    root.style.setProperty('--theme-bg', theme.darkBg);
    root.style.setProperty('--theme-surface', 'rgba(6, 11, 24, 0.78)');
    root.style.setProperty('--theme-text-primary', '#f3f4f6');
    root.style.setProperty('--theme-text-secondary', '#cbd5e1');
    root.style.setProperty('--theme-text-muted', '#94a3b8');
    root.style.setProperty('--theme-border', 'rgba(255, 255, 255, 0.14)');
    root.style.setProperty('--theme-panel-gradient', theme.panelGradient);
    root.style.setProperty('--theme-btn-active-bg', theme.activeBtnBg);
    root.style.setProperty('--theme-btn-active-text', theme.activeBtnText);
  }

  // Update meta theme-color for mobile address bar
  let metaTheme = document.querySelector('meta[name="theme-color"]');
  if (!metaTheme) {
    metaTheme = document.createElement('meta');
    metaTheme.setAttribute('name', 'theme-color');
    document.head.appendChild(metaTheme);
  }
  metaTheme.setAttribute('content', colorMode === 'light' ? '#f7f6f2' : theme.darkBg);
}
