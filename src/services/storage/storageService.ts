import { UserSettings, SavedItem } from '../../types';
import { sanitizeGroqModel } from '../ai/aiModels';

export const DEFAULT_SETTINGS: UserSettings = {
  aiConfig: {
    provider: 'builtin_mock',
    modelName: 'gemini-1.5-flash',
    apiKey: '',
    temperature: 0.7,
  },
  defaultSearchEngine: 'google',
  theme: 'glass',
  sidebarPosition: 'left',
  sidebarWidth: 290,
  collapsed: false,
  enableSelectionToolbar: true,
  enableFloatingTrigger: true,
  keyboardShortcut: 'Alt+Space', // Or Ctrl+Space
  liveCaptionsLanguage: 'en-US',
  readerFontSize: 18,
  readerTheme: 'dark',
  privacyMode: true,
  collections: ['Research', 'Study', 'Coding', 'Work', 'Ideas', 'Shopping', 'Watch Later'],
};

class StorageService {
  private hasChromeStorage(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage;
  }

  private sanitizeSettings(settings: UserSettings): UserSettings {
    const copy = { ...settings };
    if (copy.aiConfig) {
      if (copy.aiConfig.provider === 'groq') {
        copy.aiConfig.modelName = sanitizeGroqModel(copy.aiConfig.modelName);
      }
    }
    return copy;
  }

  async getSettings(): Promise<UserSettings> {
    if (this.hasChromeStorage()) {
      try {
        const result = await chrome.storage.sync.get('hyperlink_settings');
        if (result && result.hyperlink_settings) {
          const loaded = this.sanitizeSettings({ ...DEFAULT_SETTINGS, ...result.hyperlink_settings });
          if (result.hyperlink_settings.aiConfig?.modelName !== loaded.aiConfig?.modelName) {
            chrome.storage.sync.set({ hyperlink_settings: loaded }).catch(() => {});
          }
          return loaded;
        }
      } catch (e) {
        console.warn('Failed to load from chrome.storage.sync, falling back to local', e);
      }
    }
    // LocalStorage fallback
    try {
      const stored = localStorage.getItem('hyperlink_settings');
      if (stored) {
        const loaded = this.sanitizeSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(stored) });
        localStorage.setItem('hyperlink_settings', JSON.stringify(loaded));
        return loaded;
      }
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
    return DEFAULT_SETTINGS;
  }

  async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated: UserSettings = {
      ...current,
      ...settings,
      aiConfig: settings.aiConfig ? { ...current.aiConfig, ...settings.aiConfig } : current.aiConfig,
    };
    const sanitized = this.sanitizeSettings(updated);
    
    if (this.hasChromeStorage()) {
      try {
        await chrome.storage.sync.set({ hyperlink_settings: sanitized });
      } catch (e) {
        console.warn('Failed to save to chrome.storage.sync', e);
      }
    }
    try {
      localStorage.setItem('hyperlink_settings', JSON.stringify(sanitized));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
    return sanitized;
  }

  async getSavedItems(): Promise<SavedItem[]> {
    if (this.hasChromeStorage()) {
      try {
        const result = await chrome.storage.local.get('hyperlink_saved_items');
        if (result && result.hyperlink_saved_items) {
          return result.hyperlink_saved_items;
        }
      } catch (e) {
        console.warn('Failed to get saved items from chrome.storage.local', e);
      }
    }
    try {
      const stored = localStorage.getItem('hyperlink_saved_items');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  }

  async saveItem(item: Omit<SavedItem, 'id' | 'timestamp'>): Promise<SavedItem> {
    const newItem: SavedItem = {
      ...item,
      id: 'save_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      timestamp: Date.now(),
    };

    const items = await this.getSavedItems();
    const updated = [newItem, ...items];

    if (this.hasChromeStorage()) {
      try {
        await chrome.storage.local.set({ hyperlink_saved_items: updated });
      } catch (e) {
        console.warn('Error saving item to chrome.storage.local', e);
      }
    }
    try {
      localStorage.setItem('hyperlink_saved_items', JSON.stringify(updated));
    } catch (e) {}

    return newItem;
  }

  async deleteSavedItem(id: string): Promise<void> {
    const items = await this.getSavedItems();
    const updated = items.filter(i => i.id !== id);
    if (this.hasChromeStorage()) {
      try {
        await chrome.storage.local.set({ hyperlink_saved_items: updated });
      } catch (e) {}
    }
    try {
      localStorage.setItem('hyperlink_saved_items', JSON.stringify(updated));
    } catch (e) {}
  }

  async clearAllData(): Promise<void> {
    if (this.hasChromeStorage()) {
      try {
        await chrome.storage.local.clear();
        await chrome.storage.sync.clear();
      } catch (e) {}
    }
    try {
      localStorage.removeItem('hyperlink_settings');
      localStorage.removeItem('hyperlink_saved_items');
    } catch (e) {}
  }
}

export const storageService = new StorageService();
