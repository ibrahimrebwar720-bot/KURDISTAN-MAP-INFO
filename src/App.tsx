import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FactItem } from './data/kurdishHistoryData';
import { CollectionItem, PhotoSubmission } from './types/history';
import {
  loadStoredFacts,
  loadStoredCollections,
  getAdminState,
  setAdminState,
  loadStoredSubmissions,
} from './services/historyStorageService';
import {
  subscribeToCloudFacts,
  saveFactToCloud,
  deleteFactFromCloud,
  saveNotesToCloud,
  updateFactRelationsInCloud,
  subscribeToCloudCollections,
  saveCollectionToCloud,
  deleteCollectionFromCloud,
  subscribeToPhotoSubmissions,
  subscribeToTranslatedFactIds,
  getFactFromCloud,
} from './services/firestoreHistoryService';
import { KurdishDarkLeafletMap } from './components/KurdishDarkLeafletMap';
import { FactsList } from './components/FactsList';
import { Navbar, MobileBottomNav, AppWorkspaceView } from './components/Navbar';

// Resilient dynamic import helper with automatic retry for network or dev-server transient hiccups
function lazyWithRetry<T extends React.ComponentType<any>>(
  importer: () => Promise<any>,
  namedExport?: string
) {
  return React.lazy(async () => {
    try {
      const mod = await importer();
      const component =
        (namedExport && mod[namedExport]) ||
        mod.default ||
        Object.values(mod).find((v) => typeof v === 'function');
      return { default: component as T };
    } catch (error) {
      console.warn('Initial dynamic import failed, retrying...', error);
      await new Promise((resolve) => setTimeout(resolve, 750));
      const mod = await importer();
      const component =
        (namedExport && mod[namedExport]) ||
        mod.default ||
        Object.values(mod).find((v) => typeof v === 'function');
      return { default: component as T };
    }
  });
}

// Code-split heavy secondary modals for instant zero-lag initial page load
const FactDetailModal = lazyWithRetry(() => import('./components/FactDetailModal'), 'FactDetailModal');
const AdminPinModal = lazyWithRetry(() => import('./components/AdminPinModal'), 'AdminPinModal');
const FactEditorModal = lazyWithRetry(() => import('./components/FactEditorModal'), 'FactEditorModal');
const CollectionManagerModal = lazyWithRetry(() => import('./components/CollectionManagerModal'), 'CollectionManagerModal');
const ThemeSelectorModal = lazyWithRetry(() => import('./components/ThemeSelectorModal'), 'ThemeSelectorModal');
const HeroSection = lazyWithRetry(() => import('./components/HeroSection'), 'HeroSection');
const HistoricalJourneyModal = lazyWithRetry(() => import('./components/HistoricalJourneyModal'), 'HistoricalJourneyModal');
const AppSettingsModal = lazyWithRetry(() => import('./components/AppSettingsModal'), 'AppSettingsModal');
const SubmittedPhotosModal = lazyWithRetry(() => import('./components/SubmittedPhotosModal'), 'SubmittedPhotosModal');
const CrossLangSyncModal = lazyWithRetry(() => import('./components/CrossLangSyncModal'), 'CrossLangSyncModal');
import { useTheme } from './context/ThemeContext';
import { AppLanguage, useLanguage, getInitialLanguage } from './context/LanguageContext';
import {
  translateFactToLanguageDetailed,
  hasFactTextChanged,
  getFactFieldDiff,
  syncFactNonTextFieldsToLanguage,
  translateCollectionToLanguage,
  formatTranslationError,
  TranslatableFactField,
} from './services/aiTranslationService';
import {
  parseCurrentUrl,
  updateBrowserUrl,
} from './utils/urlRouter';
import { updateDynamicSeo } from './services/seoManager';

export default function App() {
  const { colorMode } = useTheme();
  const { language, isEn, setLanguage } = useLanguage();
  const [showIntro, setShowIntro] = useState<boolean>(false);

  // Initial URL parsing for deep-linking & direct article loading
  const initialUrlRef = useRef(parseCurrentUrl());
  const initialTopicFact = useRef<FactItem | null>(null);

  const [facts, setFacts] = useState<FactItem[]>(() => {
    const initLang = getInitialLanguage();
    const loaded = loadStoredFacts(initLang);
    if (initialUrlRef.current.topicId) {
      const match = loaded.find((f) => f.id === initialUrlRef.current.topicId);
      if (match) {
        initialTopicFact.current = match;
      }
    }
    return loaded;
  });

  const [collections, setCollections] = useState<CollectionItem[]>(() =>
    loadStoredCollections(getInitialLanguage())
  );
  const [isAdmin, setIsAdmin] = useState<boolean>(() => getAdminState());
  const [translatedFactIds, setTranslatedFactIds] = useState<Set<number>>(
    () => new Set(loadStoredFacts('en').map((f) => f.id))
  );
  const [photoSubmissions, setPhotoSubmissions] = useState<PhotoSubmission[]>(() => loadStoredSubmissions());
  const [isSubmittedPhotosOpen, setIsSubmittedPhotosOpen] = useState(false);
  const [crossLangSyncTarget, setCrossLangSyncTarget] = useState<{
    fact: FactItem;
    sourceLang: AppLanguage;
    syncMode?: 'ai_text' | 'partial_text' | 'non_text';
    changedFields?: TranslatableFactField[];
    changedLabelsKu?: string[];
    changedLabelsEn?: string[];
  } | null>(null);
  const [untranslatedTopicNotice, setUntranslatedTopicNotice] = useState<{
    id: number;
    name?: string;
    translating?: boolean;
    error?: string;
  } | null>(null);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const syncToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingTopicSwitchRef = useRef<{ id: number; name?: string } | null>(null);
  const prevLanguageRef = useRef<AppLanguage>(language);

  useEffect(() => {
    return () => {
      if (syncToastTimerRef.current) {
        clearTimeout(syncToastTimerRef.current);
      }
    };
  }, []);

  const showSyncToast = (msg: string) => {
    if (syncToastTimerRef.current) {
      clearTimeout(syncToastTimerRef.current);
    }
    setSyncToast(msg);
    syncToastTimerRef.current = setTimeout(() => {
      setSyncToast((cur) => (cur === msg ? null : cur));
      syncToastTimerRef.current = null;
    }, 4200);
  };

  const [selectedFact, setSelectedFact] = useState<FactItem | null>(() => initialTopicFact.current);
  const [detailFact, setDetailFact] = useState<FactItem | null>(() => initialTopicFact.current);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(() => initialUrlRef.current.view === 'menu');
  const [directorySearchTerm, setDirectorySearchTerm] = useState<string>('');

  // Map FlyTo bridge
  const [externalFlyTo, setExternalFlyTo] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
    id?: string;
  } | null>(() => {
    if (initialTopicFact.current) {
      return {
        lat: initialTopicFact.current.lat,
        lng: initialTopicFact.current.lng,
        zoom: 8.5,
        id: `init-${initialTopicFact.current.id}`,
      };
    }
    return null;
  });

  const [showAllMarkers, setShowAllMarkers] = useState(true);
  const [showPolygon, setShowPolygon] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProvince, setSelectedProvince] = useState<string>(
    () => initialUrlRef.current.province || 'all'
  );
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  // Hero Section, Historical Journey & Settings Modal State
  // If URL has a direct topic, province, or specific view, open directly into that view (classic website behavior!)
  const [isHeroOpen, setIsHeroOpen] = useState<boolean>(() => {
    if (initialUrlRef.current.topicId || initialUrlRef.current.province) return false;
    if (
      initialUrlRef.current.view === 'map' ||
      initialUrlRef.current.view === 'journey' ||
      initialUrlRef.current.view === 'menu'
    ) {
      return false;
    }
    return true;
  });

  const [isJourneyOpen, setIsJourneyOpen] = useState<boolean>(
    () => initialUrlRef.current.view === 'journey'
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Map mode shared between Leaflet map and Settings Modal
  const [mapMode, setMapMode] = useState<'dark' | 'satellite'>('dark');

  // Admin Modals state
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [isFactEditorOpen, setIsFactEditorOpen] = useState(false);
  const [factToEdit, setFactToEdit] = useState<FactItem | null>(null);
  const [isCollectionManagerOpen, setIsCollectionManagerOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Map Point Picking state
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Google Maps Platform Quota Exceeded Alert State
  const [isGmpQuotaExceeded, setIsGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    const handleQuota = () => setIsGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  // Synchronize SEO meta tags, OpenGraph, canonical URL & Schema.org JSON-LD
  useEffect(() => {
    const activeView = isJourneyOpen
      ? 'journey'
      : isMenuOpen
      ? 'menu'
      : isHeroOpen
      ? 'hero'
      : 'map';

    updateDynamicSeo({
      detailFact,
      selectedProvinceId: selectedProvince,
      activeView,
      facts,
      language,
    });
  }, [detailFact, selectedProvince, isHeroOpen, isJourneyOpen, isMenuOpen, facts, language]);

  const handleProvinceChange = (provId: string) => {
    setSelectedProvince(provId);
    updateBrowserUrl({
      province: provId === 'all' ? null : provId,
      view: isHeroOpen ? 'hero' : 'map',
      lang: language,
      replace: false,
    });
  };

  // Global copy event listener: whenever someone copies text from the app, append source attribution
  useEffect(() => {
    const handleCopy = (e: ClipboardEvent) => {
      // Don't intercept inside input fields, textareas, or admin editable elements
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const selectedText = selection.toString().trim();
      if (!selectedText) return;

      const attribution = isEn
        ? '\n\nSource: kurdistan info map'
        : '\n\nسەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map';
      if (
        selectedText.includes('سەرچاوە: نەخشە زانیاری کوردستان-kurdistan info map') ||
        selectedText.includes('Source: kurdistan info map')
      ) {
        return;
      }

      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', `${selectedText}${attribution}`);
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [isEn]);

  // 1. Real-time Firebase Cloud Database synchronization for all users worldwide (isolated per language)
  useEffect(() => {
    if (prevLanguageRef.current !== language) {
      if (detailFact) {
        pendingTopicSwitchRef.current = { id: detailFact.id, name: detailFact.name };
      } else if (selectedFact) {
        pendingTopicSwitchRef.current = { id: selectedFact.id, name: selectedFact.name };
      }
      prevLanguageRef.current = language;
    }

    const cachedFacts = loadStoredFacts(language);
    setFacts(cachedFacts);
    setCollections(loadStoredCollections(language));
    setSelectedFact((prev) => (prev ? cachedFacts.find((f) => f.id === prev.id) || null : null));
    setDetailFact((prev) => (prev ? cachedFacts.find((f) => f.id === prev.id) || null : null));
    setIsFactEditorOpen(false);
    setUntranslatedTopicNotice(null);

    const unsubFacts = subscribeToCloudFacts((cloudFacts) => {
      setFacts(cloudFacts);

      // Handle cross-language open-topic preservation gracefully
      if (pendingTopicSwitchRef.current) {
        const pending = pendingTopicSwitchRef.current;
        pendingTopicSwitchRef.current = null;
        const matched = cloudFacts.find((f) => f.id === pending.id);
        if (matched) {
          setSelectedFact(matched);
          setDetailFact(matched);
          setUntranslatedTopicNotice(null);
          updateBrowserUrl({
            topicId: matched.id,
            factName: matched.name,
            view: 'map',
            lang: language,
            replace: true,
          });
          return;
        } else if (language === 'en') {
          setUntranslatedTopicNotice({ id: pending.id, name: pending.name });
        }
      }

      // Keep selected fact synced
      setSelectedFact((prev) => {
        if (!prev) return null;
        const found = cloudFacts.find((f) => f.id === prev.id);
        return found || null;
      });
      // Keep detail fact synced or resolve deep-linked topic if not found locally
      setDetailFact((prev) => {
        if (prev) {
          const found = cloudFacts.find((f) => f.id === prev.id);
          return found || null;
        }
        if (initialUrlRef.current.topicId) {
          const foundFromUrl = cloudFacts.find((f) => f.id === initialUrlRef.current.topicId);
          if (foundFromUrl) {
            setIsHeroOpen(false);
            updateBrowserUrl({
              topicId: foundFromUrl.id,
              factName: foundFromUrl.name,
              view: 'map',
              lang: language,
              replace: true,
            });
            return foundFromUrl;
          }
        }
        return null;
      });
    }, language);

    const unsubCollections = subscribeToCloudCollections((cloudCols) => {
      setCollections(cloudCols);
    }, language);

    const unsubSubmissions = subscribeToPhotoSubmissions((subs) => {
      setPhotoSubmissions(subs);
    });

    return () => {
      unsubFacts();
      unsubCollections();
      unsubSubmissions();
    };
  }, [language]);

  // Real-time subscription to translated English fact IDs when Admin is active
  useEffect(() => {
    if (!isAdmin) return;
    const unsubTranslatedIds = subscribeToTranslatedFactIds((ids) => {
      setTranslatedFactIds(ids);
    });
    return () => {
      unsubTranslatedIds();
    };
  }, [isAdmin]);

  // 2. Initial mount effect: synchronize deep link, title and external flyTo
  useEffect(() => {
    const initLang = getInitialLanguage();
    if (initialTopicFact.current) {
      updateBrowserUrl({
        topicId: initialTopicFact.current.id,
        factName: initialTopicFact.current.name,
        view: 'map',
        lang: initLang,
        replace: true,
      });
    } else if (initialUrlRef.current.view || initialUrlRef.current.province) {
      updateBrowserUrl({
        view: initialUrlRef.current.view,
        province: initialUrlRef.current.province,
        lang: initLang,
        replace: true,
      });
    }
  }, []);

  // 3. Browser Back/Forward history navigation (Classic Website Navigation Support!)
  useEffect(() => {
    const handlePopState = () => {
      const urlState = parseCurrentUrl();
      setSelectedProvince(urlState.province || 'all');
      if (urlState.topicId) {
        const found = facts.find((f) => f.id === urlState.topicId);
        if (found) {
          setDetailFact(found);
          setSelectedFact(found);
          setIsHeroOpen(false);
          setIsJourneyOpen(false);
          setIsMenuOpen(false);
        }
      } else {
        setDetailFact(null);
        if (urlState.view === 'journey') {
          setIsJourneyOpen(true);
          setIsMenuOpen(false);
          setIsHeroOpen(false);
        } else if (urlState.view === 'menu') {
          setIsMenuOpen(true);
          setIsJourneyOpen(false);
          setIsHeroOpen(false);
        } else if (urlState.view === 'map') {
          setIsHeroOpen(false);
          setIsJourneyOpen(false);
          setIsMenuOpen(false);
        } else if (urlState.view === 'hero' || !urlState.view) {
          setIsHeroOpen(true);
          setIsJourneyOpen(false);
          setIsMenuOpen(false);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [facts]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isPickingLocation) {
          setIsPickingLocation(false);
          setIsFactEditorOpen(true);
        } else if (isJourneyOpen) {
          handleCloseJourney();
        } else if (isAdminPinModalOpen) {
          setIsAdminPinModalOpen(false);
        } else if (isFactEditorOpen) {
          setIsFactEditorOpen(false);
        } else if (isCollectionManagerOpen) {
          setIsCollectionManagerOpen(false);
        } else if (detailFact) {
          handleCloseDetail();
        } else if (isMenuOpen) {
          handleCloseMenu();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    detailFact,
    isMenuOpen,
    isJourneyOpen,
    isAdminPinModalOpen,
    isFactEditorOpen,
    isCollectionManagerOpen,
    isPickingLocation,
    isHeroOpen,
  ]);

  // Fact Selection & Smooth Map FlyTo Bridge
  const handleSelectFact = useCallback((fact: FactItem) => {
    setSelectedFact(fact);
    setExternalFlyTo({
      lat: fact.lat,
      lng: fact.lng,
      zoom: 8.5,
      id: `fact-${fact.id}-${Date.now()}`,
    });
  }, []);

  const handleDeselectFact = useCallback(() => {
    setSelectedFact(null);
  }, []);

  // URL-synchronized View & Detail Navigation Handlers
  const handleOpenDetail = (fact: FactItem) => {
    setDetailFact(fact);
    setSelectedFact(fact);
    updateBrowserUrl({
      topicId: fact.id,
      factName: fact.name,
      view: 'map',
      lang: language,
      replace: false,
    });
  };

  const handleCloseDetail = () => {
    setDetailFact(null);
    updateBrowserUrl({
      topicId: null,
      view: isHeroOpen ? 'hero' : isJourneyOpen ? 'journey' : isMenuOpen ? 'menu' : 'map',
      lang: language,
      replace: false,
    });
  };

  const handleEnterMap = () => {
    setIsHeroOpen(false);
    setIsMenuOpen(false);
    setIsJourneyOpen(false);
    updateBrowserUrl({
      topicId: detailFact?.id || null,
      view: 'map',
      factName: detailFact?.name,
      lang: language,
    });
  };

  const handleReturnToHero = () => {
    setIsHeroOpen(true);
    setDetailFact(null);
    setIsJourneyOpen(false);
    setIsMenuOpen(false);
    setIsSettingsOpen(false);
    setIsFactEditorOpen(false);
    setIsCollectionManagerOpen(false);
    setIsThemeModalOpen(false);
    setIsSubmittedPhotosOpen(false);
    updateBrowserUrl({
      topicId: null,
      view: 'hero',
      lang: language,
    });
  };

  const handleOpenJourney = () => {
    setIsHeroOpen(false);
    setIsMenuOpen(false);
    setIsJourneyOpen(true);
    updateBrowserUrl({
      view: 'journey',
      lang: language,
    });
  };

  const handleCloseJourney = () => {
    setIsJourneyOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : isMenuOpen ? 'menu' : 'map',
      lang: language,
    });
  };

  const handleOpenMenu = () => {
    setIsHeroOpen(false);
    setIsJourneyOpen(false);
    setIsMenuOpen(true);
    updateBrowserUrl({
      view: 'menu',
      lang: language,
    });
  };

  const handleCloseMenu = () => {
    setIsMenuOpen(false);
    updateBrowserUrl({
      view: isHeroOpen ? 'hero' : isJourneyOpen ? 'journey' : 'map',
      lang: language,
    });
  };

  const handleSelectWorkspaceView = (view: AppWorkspaceView) => {
    if (view === 'hero') {
      handleReturnToHero();
    } else if (view === 'map') {
      handleEnterMap();
    } else if (view === 'menu') {
      handleOpenMenu();
    } else if (view === 'journey') {
      handleOpenJourney();
    }
  };

  const handleSelectFactFromHero = (fact: FactItem) => {
    setIsHeroOpen(false);
    setIsMenuOpen(false);
    setIsJourneyOpen(false);
    handleSelectFact(fact);
    handleOpenDetail(fact);
  };

  const handleSearchToDirectory = (query: string) => {
    setDirectorySearchTerm(query);
    setIsHeroOpen(false);
    setIsJourneyOpen(false);
    setIsMenuOpen(true);
    updateBrowserUrl({
      view: 'menu',
      lang: language,
    });
  };

  // Detail Modal Navigation with URL sync
  const handleModalNavigate = (direction: 'next' | 'prev') => {
    if (!detailFact || facts.length === 0) return;
    const currentIndex = facts.findIndex((f) => f.id === detailFact.id);
    const targetIndex =
      direction === 'next'
        ? (currentIndex + 1) % facts.length
        : (currentIndex - 1 + facts.length) % facts.length;
    const targetFact = facts[targetIndex];
    setDetailFact(targetFact);
    setSelectedFact(targetFact);
    updateBrowserUrl({
      topicId: targetFact.id,
      factName: targetFact.name,
      lang: language,
      replace: false,
    });
  };

  // Admin Pin Success
  const handleAdminSuccess = () => {
    setIsAdmin(true);
    setAdminState(true);
    setIsAdminPinModalOpen(false);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminState(false);
  };

  const [factEditorMode, setFactEditorMode] = useState<'photo_only' | 'standard'>('photo_only');

  // Add / Edit Fact (Immediately opens form!)
  const handleOpenAddFact = (mode: 'photo_only' | 'standard' = 'photo_only') => {
    setFactToEdit(null);
    setPickedCoords(null);
    setIsMenuOpen(false);
    setIsPickingLocation(false);
    setFactEditorMode(mode);
    setIsFactEditorOpen(true);
  };

  const handleOpenEditFact = (fact: FactItem) => {
    setFactToEdit(fact);
    setPickedCoords({ lat: fact.lat, lng: fact.lng });
    setIsFactEditorOpen(true);
  };

  const handleSaveFact = (
    savedFact: FactItem,
    options?: { isEdit?: boolean; skipCrossLangPrompt?: boolean }
  ) => {
    const prevFact = facts.find((f) => f.id === savedFact.id);
    const exists = Boolean(prevFact);
    const updatedList = exists
      ? facts.map((f) => (f.id === savedFact.id ? savedFact : f))
      : [savedFact, ...facts];

    setFacts(updatedList);
    setSelectedFact(savedFact);
    if (detailFact && detailFact.id === savedFact.id) {
      setDetailFact(savedFact);
    }
    setPickedCoords(null);

    // Persist text/topic data to Firestore cloud (URLs only, zero binary uploads)
    saveFactToCloud(savedFact, language).catch((err) => {
      console.error('Failed to sync fact to cloud:', err);
      showSyncToast(
        language === 'en'
          ? 'Failed to save changes to cloud database.'
          : 'پاشەکەوتکردن لە بنکەی داتای هەوردا سەرکەوتوو نەبوو.'
      );
    });

    // Bidirectional cross-language sync (`ckb <-> en`) for edits & new entries
    const targetLang: AppLanguage = language === 'ckb' ? 'en' : 'ckb';
    if (isAdmin && !options?.skipCrossLangPrompt) {
      const isEditFlow = options?.isEdit ?? exists;
      if (!isEditFlow) {
        // Brand-new entry: offer full translation & sync to the other language
        setCrossLangSyncTarget({
          fact: savedFact,
          sourceLang: language,
          syncMode: 'ai_text',
        });
      } else {
        const diff = getFactFieldDiff(prevFact, savedFact);

        if (diff.changedTextFields.length === 0 && diff.hasStructureChange) {
          // Non-text edit (image, coords, dates, polygon, category, relations): sync directly WITHOUT AI quota!
          syncFactNonTextFieldsToLanguage(savedFact, targetLang)
            .then((updated) => {
              if (updated) {
                showSyncToast(
                  language === 'en'
                    ? 'Images/location/dates synced to Kurdish Sorani without AI ✓'
                    : 'وێنە/شوێن/مێژووی بابەتەکە بێ AI لە بەشی ئینگلیزیش نوێکرایەوە ✓'
                );
              } else {
                // Target entry does not exist in the other language yet: offer to translate & create it
                setCrossLangSyncTarget({
                  fact: savedFact,
                  sourceLang: language,
                  syncMode: 'ai_text',
                });
              }
            })
            .catch((err) => {
              console.error('Non-text cross-lang sync failed:', err);
              showSyncToast(
                language === 'en'
                  ? 'Failed to sync non-text changes to Kurdish Sorani.'
                  : 'هاوکاتکردنی گۆڕانکارییەکان لە بەشی ئینگلیزیدا سەرکەوتوو نەبوو.'
              );
            });
        } else if (diff.changedTextFields.length > 0) {
          setCrossLangSyncTarget({
            fact: savedFact,
            sourceLang: language,
            syncMode: diff.hasSummaryOrFullTextChange ? 'ai_text' : 'partial_text',
            changedFields: diff.changedTextFields,
            changedLabelsKu: diff.changedLabelsKu,
            changedLabelsEn: diff.changedLabelsEn,
          });
        }
      }
    }
  };

  const handleDeleteFact = (
    factId: number,
    options?: { deleteFromEnglish?: boolean }
  ) => {
    const updatedList = facts.filter((f) => f.id !== factId);
    setFacts(updatedList);

    if (selectedFact?.id === factId) {
      setSelectedFact(updatedList.length > 0 ? updatedList[0] : null);
    }
    if (detailFact?.id === factId) {
      setDetailFact(null);
    }

    // Persist delete to Firestore cloud
    deleteFactFromCloud(factId, language).catch((err) => {
      console.error('Failed to delete fact from cloud:', err);
    });

    // Cascade delete to the other language collection if chosen (`ckb <-> en`)
    if (options?.deleteFromEnglish) {
      const otherLang: AppLanguage = language === 'ckb' ? 'en' : 'ckb';
      deleteFactFromCloud(factId, otherLang).catch((err) => {
        console.error(`Failed to cascade delete fact from ${otherLang} cloud:`, err);
      });
    }
  };

  // Save additional notes inline
  const handleSaveNotes = (factId: number, notes: string) => {
    const targetFact = facts.find((f) => f.id === factId);
    const updatedFact = targetFact ? { ...targetFact, additionalNotes: notes } : null;
    const updatedList = facts.map((f) => {
      if (f.id === factId) {
        return { ...f, additionalNotes: notes };
      }
      return f;
    });

    setFacts(updatedList);

    if (selectedFact && selectedFact.id === factId) {
      setSelectedFact({ ...selectedFact, additionalNotes: notes });
    }
    if (detailFact && detailFact.id === factId) {
      setDetailFact({ ...detailFact, additionalNotes: notes });
    }

    // Persist to Firestore cloud
    saveNotesToCloud(factId, notes, targetFact, language).catch((err) => {
      console.error('Failed to save notes to cloud:', err);
      showSyncToast(
        language === 'en'
          ? 'Failed to save notes to cloud database.'
          : 'پاشەکەوتکردنی تێبینی لە هەوردا سەرکەوتوو نەبوو.'
      );
    });

    if (isAdmin && updatedFact && hasFactTextChanged(targetFact, updatedFact)) {
      setCrossLangSyncTarget({
        fact: updatedFact,
        sourceLang: language,
        syncMode: 'partial_text',
        changedFields: ['additionalNotes'],
        changedLabelsKu: ['تێبینی زیاتر'],
        changedLabelsEn: ['Additional Notes'],
      });
    }
  };

  // Save relations / topic linking (Strictly Admin only; syncs non-text IDs to EN without AI)
  const handleSaveLinks = async (
    sourceFactId: number,
    targetFactIds: number[],
    parentFactId?: number,
    allyFactIds?: number[]
  ) => {
    if (!isAdmin) {
      console.warn('Unauthorized: Only Admin can link or modify topic relationships.');
      return;
    }

    const existingFact = facts.find((f) => f.id === sourceFactId);
    const normalizedParentId = typeof parentFactId === 'number' ? parentFactId : undefined;
    const normalizedAllyIds = Array.isArray(allyFactIds) ? allyFactIds : undefined;
    const updatedFact: FactItem | null = existingFact
      ? {
          ...existingFact,
          relatedFactIds: targetFactIds,
          parentFactId: normalizedParentId,
          allyFactIds: normalizedAllyIds,
        }
      : null;

    // 1. Optimistic local update
    setFacts((prev) =>
      prev.map((f) => {
        if (f.id === sourceFactId) {
          return {
            ...f,
            relatedFactIds: targetFactIds,
            parentFactId: normalizedParentId,
            allyFactIds: normalizedAllyIds,
          };
        }
        return f;
      })
    );

    if (selectedFact && selectedFact.id === sourceFactId) {
      setSelectedFact((prev) =>
        prev
          ? {
              ...prev,
              relatedFactIds: targetFactIds,
              parentFactId: normalizedParentId,
              allyFactIds: normalizedAllyIds,
            }
          : null
      );
    }

    if (detailFact && detailFact.id === sourceFactId) {
      setDetailFact((prev) =>
        prev
          ? {
              ...prev,
              relatedFactIds: targetFactIds,
              parentFactId: normalizedParentId,
              allyFactIds: normalizedAllyIds,
            }
          : null
      );
    }

    // 2. Cloud Firestore update
    await updateFactRelationsInCloud(sourceFactId, targetFactIds, parentFactId, allyFactIds, language).catch((err) => {
      console.error('Failed to sync fact relations to cloud:', err);
    });

    // 3. Relations are non-text IDs: sync directly across languages (`ckb <-> en`) without burning AI quota
    if (updatedFact) {
      const otherLang: AppLanguage = language === 'ckb' ? 'en' : 'ckb';
      const synced = await syncFactNonTextFieldsToLanguage(updatedFact, otherLang).catch((err) => {
        console.error(`Failed to sync relations to ${otherLang}:`, err);
        return false;
      });
      if (synced) {
        showSyncToast(
          language === 'en'
            ? 'Linked topics synced to Kurdish Sorani without AI ✓'
            : 'پەیوەندییەکانی بابەتەکە بێ AI لە بەشی ئینگلیزیش هاوکات کران ✓'
        );
      }
    }
  };

  const handleConfirmCrossLangSync = async () => {
    if (!crossLangSyncTarget) return;
    const targetLang: AppLanguage = crossLangSyncTarget.sourceLang === 'ckb' ? 'en' : 'ckb';
    if (crossLangSyncTarget.syncMode === 'non_text') {
      await syncFactNonTextFieldsToLanguage(crossLangSyncTarget.fact, targetLang);
    } else {
      await translateFactToLanguageDetailed(crossLangSyncTarget.fact, targetLang, {
        fieldsToTranslate: crossLangSyncTarget.changedFields,
      });
    }
    if (targetLang === 'en') {
      setTranslatedFactIds((prev) => {
        const next = new Set(prev);
        next.add(crossLangSyncTarget.fact.id);
        return next;
      });
    }
    setCrossLangSyncTarget(null);
    showSyncToast(
      language === 'en'
        ? targetLang === 'en'
          ? 'Changes synced to English ✓'
          : 'Changes synced to Kurdish Sorani ✓'
        : targetLang === 'en'
        ? 'گۆڕانکارییەکان لە بەشی ئینگلیزیش هاوتا کران ✓'
        : 'گۆڕانکارییەکان لە بەشی کوردیش هاوتا کران ✓'
    );
  };

  // Map Point Picking flow
  const handleStartPickLocation = () => {
    setIsFactEditorOpen(false);
    setIsMenuOpen(false);
    setIsPickingLocation(true);
  };

  const handlePickLocationOnMap = useCallback((lat: number, lng: number) => {
    setPickedCoords({ lat, lng });
    setIsPickingLocation(false);
    setIsFactEditorOpen(true);
  }, []);

  const handleCancelPickLocation = useCallback(() => {
    setIsPickingLocation(false);
    setIsFactEditorOpen(true);
  }, []);

  const handleReplayIntro = useCallback(() => setShowIntro(true), []);
  const handleMapIntroComplete = useCallback(() => setShowIntro(false), []);

  // Collections handlers (Synced to Firestore cloud; bidirectional `ckb <-> en` cascade)
  const handleAddCollection = (newCol: CollectionItem) => {
    const updated = [...collections, newCol];
    setCollections(updated);
    saveCollectionToCloud(newCol, language).catch((err) => {
      console.error('Failed to save collection to cloud:', err);
    });
    const otherLang: AppLanguage = language === 'ckb' ? 'en' : 'ckb';
    translateCollectionToLanguage(newCol, otherLang)
      .then((translatedCol) => saveCollectionToCloud(translatedCol, otherLang))
      .catch((err) => console.warn(`Failed to sync new collection to ${otherLang}:`, err));
  };

  const handleUpdateCollection = (updatedCol: CollectionItem) => {
    const updated = collections.map((c) =>
      c.id === updatedCol.id ? updatedCol : c
    );
    setCollections(updated);
    saveCollectionToCloud(updatedCol, language).catch((err) => {
      console.error('Failed to update collection in cloud:', err);
    });
    const otherLang: AppLanguage = language === 'ckb' ? 'en' : 'ckb';
    const prevCol = collections.find((c) => c.id === updatedCol.id);
    const shouldForceRetranslate =
      language === 'ckb' &&
      Boolean(prevCol) &&
      prevCol?.name !== updatedCol.name &&
      prevCol?.nameEn === updatedCol.nameEn;
    translateCollectionToLanguage(updatedCol, otherLang, shouldForceRetranslate)
      .then((translatedCol) => saveCollectionToCloud(translatedCol, otherLang))
      .catch((err) => console.warn(`Failed to sync updated collection to ${otherLang}:`, err));
  };

  const handleDeleteCollection = (colId: string) => {
    const updated = collections.filter((c) => c.id !== colId);
    setCollections(updated);
    if (selectedCategory === colId) {
      setSelectedCategory('all');
    }
    deleteCollectionFromCloud(colId, language).catch((err) => {
      console.error('Failed to delete collection from cloud:', err);
    });
    const otherLang: AppLanguage = language === 'ckb' ? 'en' : 'ckb';
    deleteCollectionFromCloud(colId, otherLang).catch((err) => {
      console.warn(`Failed to cascade delete collection from ${otherLang}:`, err);
    });
  };

  const pendingSubmissionsCount = photoSubmissions.filter((s) => s.status === 'pending').length;
  const activeWorkspaceView: AppWorkspaceView = isHeroOpen
    ? 'hero'
    : isJourneyOpen
    ? 'journey'
    : isMenuOpen
    ? 'menu'
    : 'map';

  return (
    <div
      className={`h-full h-[100dvh] w-full overflow-hidden flex flex-col font-sans selection:bg-amber-500 selection:text-black text-xs ${
        colorMode === 'light' ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#05070e] text-slate-100'
      }`}
    >
      {/* Persistent Top Navigation Tabs when outside Hero (includes Home button) */}
      {!isHeroOpen && (
        <Navbar
          activeView={activeWorkspaceView}
          onSelectView={handleSelectWorkspaceView}
          onOpenHero={handleReturnToHero}
          onOpenSettings={() => setIsSettingsOpen(true)}
          factsCount={facts.length}
        />
      )}

      {/* Main Screen Workspace */}
      <main className="relative flex-1 min-h-0 w-full h-full overflow-hidden">
        {/* Full Viewport Interactive Kurdish Clean Dark Map */}
        <KurdishDarkLeafletMap
          facts={facts}
          selectedFact={selectedFact}
          onSelectFact={handleSelectFact}
          onDeselectFact={handleDeselectFact}
          onOpenDetail={handleOpenDetail}
          showAllMarkers={showAllMarkers}
          setShowAllMarkers={setShowAllMarkers}
          showPolygon={showPolygon}
          setShowPolygon={setShowPolygon}
          onOpenHero={handleReturnToHero}
          onOpenSettings={() => setIsSettingsOpen(true)}
          mapMode={mapMode}
          setMapMode={setMapMode}
          onOpenMenu={handleOpenMenu}
          onOpenJourney={handleOpenJourney}
          onOpenTheme={() => {
            setIsThemeModalOpen(true);
          }}
          activeTagFilter={selectedCategory}
          setActiveTagFilter={setSelectedCategory}
          selectedProvince={selectedProvince}
          onSelectProvince={handleProvinceChange}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          isAdmin={isAdmin}
          onTriggerAdminPin={() => {
            setIsAdminPinModalOpen(true);
          }}
          onOpenAddFact={handleOpenAddFact}
          onOpenSubmittedPhotos={() => setIsSubmittedPhotosOpen(true)}
          pendingSubmissionsCount={pendingSubmissionsCount}
          onLogoutAdmin={handleAdminLogout}
          isPickingLocation={isPickingLocation}
          onPickLocation={handlePickLocationOnMap}
          onCancelPickLocation={handleCancelPickLocation}
          pickedCoords={pickedCoords}
          onReplayIntro={handleReplayIntro}
          playMapIntro={showIntro}
          onMapIntroComplete={handleMapIntroComplete}
          externalFlyTo={externalFlyTo}
        />

        {/* Workspace View for Archive Directory (پێڕست) */}
        {isMenuOpen && (
          <div
            className={`absolute inset-0 z-30 flex flex-col overflow-hidden animate-page-enter ${
              colorMode === 'light' ? 'bg-[#f7f6f2] text-slate-900' : 'bg-[#030611] text-slate-100'
            }`}
          >
            <FactsList
              facts={facts}
              selectedFact={selectedFact}
              onSelectFact={(fact) => {
                handleEnterMap();
                handleSelectFact(fact);
                setIsMenuOpen(false);
              }}
              onOpenDetail={handleOpenDetail}
              collections={collections}
              selectedCollectionId={selectedCategory}
              onSelectCollection={setSelectedCategory}
              activeCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              selectedProvince={selectedProvince}
              onSelectProvince={handleProvinceChange}
              isAdmin={isAdmin}
              translatedFactIds={translatedFactIds}
              onOpenAddFact={handleOpenAddFact}
              onOpenSubmittedPhotos={() => setIsSubmittedPhotosOpen(true)}
              pendingSubmissionsCount={pendingSubmissionsCount}
              onOpenEditFact={handleOpenEditFact}
              onOpenCollectionManager={() => setIsCollectionManagerOpen(true)}
              onOpenTheme={() => setIsThemeModalOpen(true)}
              onOpenHero={handleReturnToHero}
              onClose={handleCloseMenu}
              onLogoutAdmin={handleAdminLogout}
              onFactsLocationsFixed={(updatedList) => {
                const updatedById = new Map(updatedList.map((f) => [f.id, f]));
                setFacts((prev) => prev.map((f) => updatedById.get(f.id) || f));
                setSelectedFact((prev) => (prev && updatedById.get(prev.id)) || prev);
                setDetailFact((prev) => (prev && updatedById.get(prev.id)) || prev);
                showSyncToast(
                  language === 'en'
                    ? `Dispersed ${updatedList.length} overlapping map pins ✓`
                    : `${updatedList.length} پۆینتی تێکەڵبوو بەسەر پارێزگاکاندا پەرت کران ✓`
                );
              }}
              initialSearchTerm={directorySearchTerm}
            />
          </div>
        )}

        {/* Workspace View for History Cards (گەشتی مێژوویی) inside <main> so tabs & Home button remain visible */}
        <React.Suspense fallback={null}>
          <HistoricalJourneyModal
            isOpen={isJourneyOpen}
            onClose={handleCloseJourney}
            onOpenHero={handleReturnToHero}
            facts={facts}
            onOpenDetail={(fact: FactItem) => {
              setIsJourneyOpen(false);
              handleOpenDetail(fact);
            }}
            onFlyToFact={(fact: FactItem) => {
              setIsJourneyOpen(false);
              handleEnterMap();
              handleSelectFact(fact);
            }}
          />
        </React.Suspense>
      </main>

      {/* Mobile Bottom Navigation Tabs when outside Hero (includes Home button) */}
      {!isHeroOpen && (
        <MobileBottomNav
          activeView={activeWorkspaceView}
          onSelectView={handleSelectWorkspaceView}
          onOpenHero={handleReturnToHero}
        />
      )}

      {/* Lazy loaded modals suspended seamlessly without blocking initial page render */}
      <React.Suspense fallback={null}>
        {/* Fact Detail Modal (With Related Topics & Documents) */}
        <FactDetailModal
          fact={detailFact}
          onClose={handleCloseDetail}
          onNavigate={handleModalNavigate}
          onFlyToMap={(fact: FactItem) => {
            handleEnterMap();
            handleSelectFact(fact);
          }}
          isAdmin={isAdmin}
          translatedFactIds={translatedFactIds}
          onEditFact={(fact: FactItem) => {
            handleCloseDetail();
            handleOpenEditFact(fact);
          }}
          onSaveNotes={handleSaveNotes}
          totalFactsCount={facts.length}
          allFacts={facts}
          onSelectFact={(fact: FactItem) => {
            handleOpenDetail(fact);
          }}
          onSaveLinks={handleSaveLinks}
        />

        {/* Admin Secret PIN Verification Modal */}
        <AdminPinModal
          isOpen={isAdminPinModalOpen}
          onClose={() => setIsAdminPinModalOpen(false)}
          onSuccess={handleAdminSuccess}
        />

        {/* Fact Editor Modal (Add/Edit Fact, Relations Linking, Coordinates, Notes) */}
        <FactEditorModal
          isOpen={isFactEditorOpen}
          onClose={() => setIsFactEditorOpen(false)}
          factToEdit={factToEdit}
          initialMode={factEditorMode}
          collections={collections}
          allFacts={facts}
          onSave={handleSaveFact}
          onDelete={handleDeleteFact}
          onStartPickLocation={handleStartPickLocation}
          pickedCoords={pickedCoords}
          totalFactsCount={facts.length}
          translatedFactIds={translatedFactIds}
        />

        {/* Collection Manager Modal (Manage collections for Menu) */}
        <CollectionManagerModal
          isOpen={isCollectionManagerOpen}
          onClose={() => setIsCollectionManagerOpen(false)}
          collections={collections}
          onAddCollection={handleAddCollection}
          onUpdateCollection={handleUpdateCollection}
          onDeleteCollection={handleDeleteCollection}
        />

        {/* App Theme & Color Customizer Modal (بەشی ڕووکار) */}
        <ThemeSelectorModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
        />

        {/* App Settings Modal (ڕێکخستنەکان) */}
        <AppSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenHero={handleReturnToHero}
          mapMode={mapMode}
          setMapMode={setMapMode}
          showAllMarkers={showAllMarkers}
          setShowAllMarkers={setShowAllMarkers}
          showPolygon={showPolygon}
          setShowPolygon={setShowPolygon}
          onReplayIntro={() => {
            setIsSettingsOpen(false);
            setIsHeroOpen(false);
            setShowIntro(true);
          }}
          onOpenTheme={() => {
            setIsSettingsOpen(false);
            setIsThemeModalOpen(true);
          }}
          isAdmin={isAdmin}
          onTriggerAdminPin={() => {
            setIsSettingsOpen(false);
            setIsAdminPinModalOpen(true);
          }}
          onLogoutAdmin={handleAdminLogout}
          onOpenAddFact={handleOpenAddFact}
          onOpenSubmittedPhotos={() => {
            setIsSettingsOpen(false);
            setIsSubmittedPhotosOpen(true);
          }}
          pendingSubmissionsCount={pendingSubmissionsCount}
          factsCount={facts.length}
        />

        {/* Entrance Hero Section (مەدخەل و سێکشنی سەرەکی) */}
        {isHeroOpen && (
          <HeroSection
            facts={facts}
            onEnterMap={handleEnterMap}
            onOpenJourney={handleOpenJourney}
            onOpenMenu={handleOpenMenu}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onSelectFactFromHero={handleSelectFactFromHero}
            onSearchToDirectory={handleSearchToDirectory}
          />
        )}

      {/* Admin Submitted Photos Moderation Modal (وێنە نێردراوەکان) */}
      {isAdmin && isSubmittedPhotosOpen && (
        <SubmittedPhotosModal
          isOpen={isSubmittedPhotosOpen}
          onClose={() => setIsSubmittedPhotosOpen(false)}
          submissions={photoSubmissions}
          allFacts={facts}
          onFactUpdated={(updatedFact: FactItem) => {
            setFacts((prev) => prev.map((f) => (f.id === updatedFact.id ? updatedFact : f)));
            if (selectedFact?.id === updatedFact.id) setSelectedFact(updatedFact);
            if (detailFact?.id === updatedFact.id) setDetailFact(updatedFact);
          }}
          onSelectFact={(fact: FactItem) => {
            handleSelectFact(fact);
            handleOpenDetail(fact);
          }}
        />
      )}

      {/* Cross-Language Edit Sync Confirmation Modal */}
      {crossLangSyncTarget && (
        <CrossLangSyncModal
          isOpen={Boolean(crossLangSyncTarget)}
          fact={crossLangSyncTarget.fact}
          sourceLang={crossLangSyncTarget.sourceLang}
          syncMode={crossLangSyncTarget.syncMode}
          changedLabelsKu={crossLangSyncTarget.changedLabelsKu}
          changedLabelsEn={crossLangSyncTarget.changedLabelsEn}
          onConfirmYes={handleConfirmCrossLangSync}
          onDeclineNo={() => setCrossLangSyncTarget(null)}
        />
      )}

      {/* Untranslated Topic Notice when switching to English on a topic only in Master ckb */}
      {untranslatedTopicNotice && (
        <div
          dir={isEn ? 'ltr' : 'rtl'}
          className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[1400] w-[92vw] max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-md space-y-2.5 animate-fade-in ${
            colorMode === 'light'
              ? 'bg-white/95 border-amber-500/60 text-slate-900'
              : 'bg-[#0b1020]/95 border-amber-400/50 text-slate-100'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 min-w-0">
              <p
                className={`text-xs font-extrabold ${
                  colorMode === 'light' ? 'text-amber-800' : 'text-amber-300'
                }`}
              >
                {untranslatedTopicNotice.name
                  ? `"${untranslatedTopicNotice.name}" is not yet translated into English`
                  : 'This entry is not yet translated into English'}
              </p>
              <p
                className={`text-[11px] leading-snug ${
                  colorMode === 'light' ? 'text-slate-600' : 'text-slate-300'
                }`}
              >
                This topic exists in the Central Kurdish (ckb) knowledge base and has not been translated into English yet.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUntranslatedTopicNotice(null)}
              className={`text-xs px-1.5 py-0.5 cursor-pointer rounded-md ${
                colorMode === 'light'
                  ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          {untranslatedTopicNotice.error && (
            <p
              className={`text-[11px] border rounded-lg px-2.5 py-1.5 ${
                colorMode === 'light'
                  ? 'text-rose-800 bg-rose-50 border-rose-300'
                  : 'text-rose-300 bg-rose-950/60 border-rose-500/40'
              }`}
            >
              {untranslatedTopicNotice.error}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                pendingTopicSwitchRef.current = {
                  id: untranslatedTopicNotice.id,
                  name: untranslatedTopicNotice.name,
                };
                setUntranslatedTopicNotice(null);
                setLanguage('ckb');
              }}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-xs cursor-pointer transition-colors ${
                colorMode === 'light'
                  ? 'preserve-contrast bg-amber-700 hover:bg-amber-800 text-white'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              Read in کوردی
            </button>
            {isAdmin && (
              <button
                type="button"
                disabled={untranslatedTopicNotice.translating}
                onClick={async () => {
                  const targetId = untranslatedTopicNotice.id;
                  setUntranslatedTopicNotice((prev) =>
                    prev ? { ...prev, translating: true, error: undefined } : null
                  );
                  try {
                    const ckbSource = await getFactFromCloud(targetId, 'ckb');
                    if (!ckbSource) {
                      throw new Error('Kurdish source entry not found.');
                    }
                    const outcome = await translateFactToLanguageDetailed(ckbSource, 'en');
                    setUntranslatedTopicNotice(null);
                    setDetailFact(outcome.fact);
                    setSelectedFact(outcome.fact);
                  } catch (err) {
                    setUntranslatedTopicNotice((prev) =>
                      prev
                        ? {
                            ...prev,
                            translating: false,
                            error: formatTranslationError(err, language),
                          }
                        : null
                    );
                  }
                }}
                className="preserve-contrast px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                {untranslatedTopicNotice.translating ? 'Translating...' : 'Translate Now (AI)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Subtle Non-AI Sync Toast */}
      {syncToast && (
        <div
          dir={isEn ? 'ltr' : 'rtl'}
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[1450] px-4 py-2 rounded-xl border text-xs font-bold shadow-xl backdrop-blur-md animate-fade-in ${
            colorMode === 'light'
              ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
              : 'bg-emerald-950/95 border-emerald-400/50 text-emerald-200'
          }`}
        >
          {syncToast}
        </div>
      )}
    </React.Suspense>
  </div>
);
}
