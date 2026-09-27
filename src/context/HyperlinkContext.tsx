import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SidebarFeatureId, PageMetadata, UserSettings, SavedItem } from '../types';
import { detectPageContext } from '../utils/pageContext';
import { storageService, DEFAULT_SETTINGS } from '../services/storage/storageService';
import { themeService, PageThemePreset } from '../services/theme/themeService';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

interface HyperlinkContextType {
  // Visibility
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  
  // Sidebar expanded / collapsed
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;

  // Active panel (Secondary panel opened beside sidebar)
  activeFeature: SidebarFeatureId | null;
  setActiveFeature: (feature: SidebarFeatureId | null) => void;
  featureProps: Record<string, any>;
  openFeatureWithProps: (feature: SidebarFeatureId, props?: Record<string, any>) => void;
  closeFeaturePanel: () => void;

  // Page Context
  pageContext: PageMetadata;
  refreshPageContext: () => void;
  selectedText: string;
  setSelectedText: (text: string) => void;

  // Settings & Theme Reactivity
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  pageTheme: PageThemePreset;
  effectiveThemeMode: 'dark' | 'light' | 'sepia';
  isLightMode: boolean;
  isEffectiveDark: boolean;
  isEffectiveSepia: boolean;
  toggleTheme: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  addToast: (title: string, type?: 'success' | 'info' | 'error' | 'warning', message?: string) => void;
  removeToast: (id: string) => void;

  // Saved Items
  savedItems: SavedItem[];
  refreshSavedItems: () => Promise<void>;

  // Universal Command Bar search focus trigger
  commandBarFocused: boolean;
  setCommandBarFocused: (focused: boolean) => void;
}

const HyperlinkContext = createContext<HyperlinkContextType | undefined>(undefined);

export const HyperlinkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [activeFeature, setActiveFeature] = useState<SidebarFeatureId | null>(null);
  const [featureProps, setFeatureProps] = useState<Record<string, any>>({});
  const [pageContext, setPageContext] = useState<PageMetadata>(() => detectPageContext());
  const [selectedText, setSelectedText] = useState<string>('');
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [commandBarFocused, setCommandBarFocused] = useState<boolean>(false);
  const [pageTheme, setPageTheme] = useState<PageThemePreset>(() => themeService.getConfig().preset);
  const [isHostDark, setIsHostDark] = useState<boolean>(false);

  // Initialize settings & theme subscription
  useEffect(() => {
    storageService.getSettings().then(s => {
      setSettings(s);
      setIsCollapsed(s.collapsed);
    });
    storageService.getSavedItems().then(items => {
      setSavedItems(items);
    });

    return themeService.subscribe((cfg) => {
      setPageTheme(cfg.preset);
    });
  }, []);

  // Detect host page dark/light native theme
  useEffect(() => {
    const checkDark = () => {
      try {
        const htmlTheme = document.documentElement.getAttribute('data-hyperlink-theme');
        if (htmlTheme === 'dark' || htmlTheme === 'amoled' || htmlTheme === 'midnight') {
          setIsHostDark(true);
          return;
        }
        if (htmlTheme === 'sepia') {
          setIsHostDark(false);
          return;
        }

        const htmlEl = document.documentElement;
        const bodyEl = document.body;
        if (
          htmlEl.classList.contains('dark') ||
          bodyEl?.classList.contains('dark') ||
          htmlEl.getAttribute('data-theme') === 'dark' ||
          bodyEl?.getAttribute('data-theme') === 'dark' ||
          htmlEl.getAttribute('data-color-mode') === 'dark'
        ) {
          setIsHostDark(true);
          return;
        }

        const target = bodyEl || htmlEl;
        if (target) {
          const bg = window.getComputedStyle(target).backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            const rgb = bg.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              const r = parseInt(rgb[0], 10);
              const g = parseInt(rgb[1], 10);
              const b = parseInt(rgb[2], 10);
              const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
              setIsHostDark(luminance < 0.45);
              return;
            }
          }
        }
        setIsHostDark(window.matchMedia?.('(prefers-color-scheme: dark)').matches || false);
      } catch {
        setIsHostDark(false);
      }
    };

    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme', 'data-color-mode', 'data-hyperlink-theme']
    });
    if (document.body) {
      observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    }
    return () => observer.disconnect();
  }, []);

  const refreshPageContext = useCallback(() => {
    const ctx = detectPageContext();
    if (selectedText) {
      ctx.selectedText = selectedText;
    }
    setPageContext(ctx);
  }, [selectedText]);

  const refreshSavedItems = useCallback(async () => {
    const items = await storageService.getSavedItems();
    setSavedItems(items);
  }, []);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    const updated = await storageService.saveSettings(newSettings);
    setSettings(updated);
  }, []);

  // Single mode: UI is permanently dark glass with white text
  const isLightMode = false;
  const isEffectiveDark = true;
  const isEffectiveSepia = false;
  const effectiveThemeMode = 'dark' as const;

  const toggleTheme = useCallback(() => {
    // UI is single mode only (dark glass with white text)
  }, []);

  // Synchronize across tabs and popup in real-time
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
      const listener = (changes: any, areaName: string) => {
        if (areaName === 'sync' || areaName === 'local') {
          if (changes.hyperlink_settings && changes.hyperlink_settings.newValue) {
            setSettings(prev => ({ ...prev, ...changes.hyperlink_settings.newValue }));
          }
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substr(2, 4);
    const newToast: ToastMessage = { ...toast, id };
    setToasts(prev => [...prev, newToast]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 4000);
  }, []);

  const addToast = useCallback((title: string, type: 'success' | 'info' | 'error' | 'warning' = 'info', message?: string) => {
    showToast({ title, type, message });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => {
      const next = !prev;
      if (next) {
        refreshPageContext();
      }
      return next;
    });
  }, [refreshPageContext]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed(prev => {
      const next = !prev;
      updateSettings({ collapsed: next });
      return next;
    });
  }, [updateSettings]);

  const openFeatureWithProps = useCallback((feature: SidebarFeatureId, props: Record<string, any> = {}) => {
    setFeatureProps({ ...props, _ts: Date.now() });
    setActiveFeature(feature);
    if (!isOpen) {
      setIsOpen(true);
    }
  }, [isOpen]);

  const closeFeaturePanel = useCallback(() => {
    setActiveFeature(null);
    setFeatureProps({});
  }, []);

  return (
    <HyperlinkContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleOpen,
        isCollapsed,
        setIsCollapsed,
        toggleCollapsed,
        activeFeature,
        setActiveFeature,
        featureProps,
        openFeatureWithProps,
        closeFeaturePanel,
        pageContext,
        refreshPageContext,
        selectedText,
        setSelectedText,
        settings,
        updateSettings,
        pageTheme,
        effectiveThemeMode,
        isLightMode,
        isEffectiveDark,
        isEffectiveSepia,
        toggleTheme,
        toasts,
        showToast,
        addToast,
        removeToast,
        savedItems,
        refreshSavedItems,
        commandBarFocused,
        setCommandBarFocused,
      }}
    >
      {children}
    </HyperlinkContext.Provider>
  );
};

export const useHyperlink = () => {
  const context = useContext(HyperlinkContext);
  if (!context) {
    throw new Error('useHyperlink must be used within a HyperlinkProvider');
  }
  return context;
};
