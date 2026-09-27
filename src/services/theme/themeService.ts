// Theme Service: Universal Website Theming Engine
// Allows live switching of website themes (Dark, Sepia, Midnight, AMOLED, High Contrast, Grayscale, Custom)
// without affecting the Hyperlink glass overlay UI.

export type PageThemePreset =
  | 'default'
  | 'dark'
  | 'amoled'
  | 'sepia'
  | 'midnight'
  | 'high_contrast'
  | 'grayscale'
  | 'custom';

export interface PageThemeConfig {
  preset: PageThemePreset;
  brightness: number; // 50 to 150 (100 = default)
  contrast: number; // 50 to 150 (100 = default)
  sepia: number; // 0 to 100
  grayscale: number; // 0 to 100
  invert: number; // 0 to 100
  rememberForSite: boolean;
}

export const DEFAULT_PAGE_THEME: PageThemeConfig = {
  preset: 'default',
  brightness: 100,
  contrast: 100,
  sepia: 0,
  grayscale: 0,
  invert: 0,
  rememberForSite: true,
};

class ThemeService {
  private styleElement: HTMLStyleElement | null = null;
  private currentConfig: PageThemeConfig = { ...DEFAULT_PAGE_THEME };
  private listeners: Set<(config: PageThemeConfig) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initForCurrentSite();
    }
  }

  private getDomain(): string {
    try {
      return window.location.hostname || 'default';
    } catch {
      return 'default';
    }
  }

  private getStorageKey(): string {
    return `hyperlink_theme_${this.getDomain()}`;
  }

  private getOrCreateStyleTag(): HTMLStyleElement {
    if (!this.styleElement || !this.styleElement.parentNode) {
      let existing = document.getElementById('hyperlink-theme-styles') as HTMLStyleElement | null;
      if (!existing) {
        existing = document.createElement('style');
        existing.id = 'hyperlink-theme-styles';
        document.head.appendChild(existing);
      }
      this.styleElement = existing;
    }
    return this.styleElement;
  }

  async initForCurrentSite(): Promise<PageThemeConfig> {
    try {
      const key = this.getStorageKey();
      let saved: string | null = null;
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        const res = await chrome.storage.local.get(key);
        saved = res[key] ? JSON.stringify(res[key]) : null;
      } else if (typeof localStorage !== 'undefined') {
        saved = localStorage.getItem(key);
      }

      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentConfig = { ...DEFAULT_PAGE_THEME, ...parsed };
        this.applyTheme(this.currentConfig, false);
      }
    } catch (e) {
      console.warn('[ThemeService] Failed to load saved theme:', e);
    }
    return this.currentConfig;
  }

  getConfig(): PageThemeConfig {
    return { ...this.currentConfig };
  }

  subscribe(listener: (config: PageThemeConfig) => void): () => void {
    this.listeners.add(listener);
    listener(this.getConfig());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const config = this.getConfig();
    this.listeners.forEach((l) => l(config));
  }

  async setPreset(preset: PageThemePreset): Promise<void> {
    const next: PageThemeConfig = {
      ...this.currentConfig,
      preset,
    };

    if (preset === 'default') {
      next.brightness = 100;
      next.contrast = 100;
      next.sepia = 0;
      next.grayscale = 0;
      next.invert = 0;
    } else if (preset === 'dark') {
      next.brightness = 95;
      next.contrast = 105;
      next.sepia = 0;
      next.grayscale = 0;
      next.invert = 100;
    } else if (preset === 'amoled') {
      next.brightness = 90;
      next.contrast = 115;
      next.sepia = 0;
      next.grayscale = 0;
      next.invert = 100;
    } else if (preset === 'sepia') {
      next.brightness = 96;
      next.contrast = 95;
      next.sepia = 60;
      next.grayscale = 0;
      next.invert = 0;
    } else if (preset === 'midnight') {
      next.brightness = 90;
      next.contrast = 110;
      next.sepia = 10;
      next.grayscale = 0;
      next.invert = 95;
    } else if (preset === 'high_contrast') {
      next.brightness = 105;
      next.contrast = 140;
      next.sepia = 0;
      next.grayscale = 0;
      next.invert = 0;
    } else if (preset === 'grayscale') {
      next.brightness = 100;
      next.contrast = 105;
      next.sepia = 0;
      next.grayscale = 100;
      next.invert = 0;
    }

    await this.applyTheme(next, next.rememberForSite);
  }

  async updateCustom(partial: Partial<PageThemeConfig>): Promise<void> {
    const next: PageThemeConfig = {
      ...this.currentConfig,
      ...partial,
      preset: 'custom',
    };
    await this.applyTheme(next, next.rememberForSite);
  }

  async setRememberForSite(remember: boolean): Promise<void> {
    this.currentConfig.rememberForSite = remember;
    if (remember) {
      await this.saveCurrentSiteTheme(this.currentConfig);
    } else {
      await this.clearSiteTheme();
    }
    this.notify();
  }

  async applyTheme(config: PageThemeConfig, save = true): Promise<void> {
    this.currentConfig = { ...config };
    const html = document.documentElement;

    if (config.preset === 'default') {
      html.removeAttribute('data-hyperlink-theme');
      if (this.styleElement && this.styleElement.parentNode) {
        this.styleElement.parentNode.removeChild(this.styleElement);
        this.styleElement = null;
      }
      if (save) {
        await this.clearSiteTheme();
      }
      this.notify();
      return;
    }

    html.setAttribute('data-hyperlink-theme', config.preset);
    const style = this.getOrCreateStyleTag();

    let css = '';

    if (config.preset === 'dark') {
      css = `
        html[data-hyperlink-theme="dark"] {
          background-color: #0f131f !important;
        }
        html[data-hyperlink-theme="dark"] body {
          background-color: #0f131f !important;
        }
        html[data-hyperlink-theme="dark"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(1.05) !important;
        }
        html[data-hyperlink-theme="dark"] img,
        html[data-hyperlink-theme="dark"] video,
        html[data-hyperlink-theme="dark"] iframe,
        html[data-hyperlink-theme="dark"] canvas,
        html[data-hyperlink-theme="dark"] picture,
        html[data-hyperlink-theme="dark"] [style*="background-image"],
        html[data-hyperlink-theme="dark"] svg:not([role="presentation"]) {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `;
    } else if (config.preset === 'amoled') {
      css = `
        html[data-hyperlink-theme="amoled"] {
          background-color: #000000 !important;
        }
        html[data-hyperlink-theme="amoled"] body {
          background-color: #000000 !important;
        }
        html[data-hyperlink-theme="amoled"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: invert(1) hue-rotate(180deg) contrast(1.15) brightness(0.9) !important;
        }
        html[data-hyperlink-theme="amoled"] img,
        html[data-hyperlink-theme="amoled"] video,
        html[data-hyperlink-theme="amoled"] iframe,
        html[data-hyperlink-theme="amoled"] canvas,
        html[data-hyperlink-theme="amoled"] picture,
        html[data-hyperlink-theme="amoled"] [style*="background-image"],
        html[data-hyperlink-theme="amoled"] svg:not([role="presentation"]) {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `;
    } else if (config.preset === 'sepia') {
      css = `
        html[data-hyperlink-theme="sepia"] {
          background-color: #f6efe2 !important;
        }
        html[data-hyperlink-theme="sepia"] body {
          background-color: #f6efe2 !important;
        }
        html[data-hyperlink-theme="sepia"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: sepia(0.65) contrast(0.94) brightness(0.97) !important;
        }
      `;
    } else if (config.preset === 'midnight') {
      css = `
        html[data-hyperlink-theme="midnight"] {
          background-color: #070d1e !important;
        }
        html[data-hyperlink-theme="midnight"] body {
          background-color: #070d1e !important;
        }
        html[data-hyperlink-theme="midnight"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: invert(0.92) hue-rotate(200deg) contrast(1.1) brightness(0.92) !important;
        }
        html[data-hyperlink-theme="midnight"] img,
        html[data-hyperlink-theme="midnight"] video,
        html[data-hyperlink-theme="midnight"] iframe,
        html[data-hyperlink-theme="midnight"] canvas,
        html[data-hyperlink-theme="midnight"] picture,
        html[data-hyperlink-theme="midnight"] [style*="background-image"],
        html[data-hyperlink-theme="midnight"] svg:not([role="presentation"]) {
          filter: invert(1) hue-rotate(160deg) !important;
        }
      `;
    } else if (config.preset === 'high_contrast') {
      css = `
        html[data-hyperlink-theme="high_contrast"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: contrast(1.4) brightness(1.05) saturate(1.1) !important;
        }
      `;
    } else if (config.preset === 'grayscale') {
      css = `
        html[data-hyperlink-theme="grayscale"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: grayscale(1) contrast(1.05) !important;
        }
      `;
    } else if (config.preset === 'custom') {
      const filters = [
        `brightness(${config.brightness}%)`,
        `contrast(${config.contrast}%)`,
        config.sepia > 0 ? `sepia(${config.sepia}%)` : '',
        config.grayscale > 0 ? `grayscale(${config.grayscale}%)` : '',
        config.invert > 0 ? `invert(${config.invert}%) hue-rotate(${Math.round(config.invert * 1.8)}deg)` : '',
      ].filter(Boolean).join(' ');

      css = `
        html[data-hyperlink-theme="custom"] body > :not(#hyperlink-extension-overlay):not(#hyperlink-screenshot-drag-overlay):not(script):not(style):not(link) {
          filter: ${filters || 'none'} !important;
        }
        ${config.invert > 50 ? `
          html[data-hyperlink-theme="custom"] img,
          html[data-hyperlink-theme="custom"] video,
          html[data-hyperlink-theme="custom"] iframe,
          html[data-hyperlink-theme="custom"] canvas,
          html[data-hyperlink-theme="custom"] picture,
          html[data-hyperlink-theme="custom"] [style*="background-image"] {
            filter: invert(1) hue-rotate(180deg) !important;
          }
        ` : ''}
      `;
    }

    style.textContent = css;

    if (save && config.rememberForSite) {
      await this.saveCurrentSiteTheme(config);
    }
    this.notify();
  }

  private async saveCurrentSiteTheme(config: PageThemeConfig): Promise<void> {
    try {
      const key = this.getStorageKey();
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.set({ [key]: config });
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(config));
      }
    } catch (e) {
      console.warn('[ThemeService] Failed to save site theme:', e);
    }
  }

  private async clearSiteTheme(): Promise<void> {
    try {
      const key = this.getStorageKey();
      if (typeof chrome !== 'undefined' && chrome.storage?.local) {
        await chrome.storage.local.remove(key);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('[ThemeService] Failed to clear site theme:', e);
    }
  }
}

export const themeService = new ThemeService();
