// Browser Tab Manager Service: proxies tab actions through Background Service Worker

export interface TabItem {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  pinned: boolean;
  windowId: number;
  audible?: boolean;
  muted?: boolean;
}

export interface TabSession {
  id: string;
  name: string;
  timestamp: number;
  tabs: Array<{ title: string; url: string }>;
}

class TabService {
  private hasRuntime(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.sendMessage;
  }

  async getAllTabs(): Promise<TabItem[]> {
    if (this.hasRuntime()) {
      try {
        const response = await new Promise<{ success: boolean; tabs: TabItem[]; error?: string }>((resolve) => {
          chrome.runtime.sendMessage({ type: 'TAB_GET_ALL' }, (res) => {
            if (chrome.runtime.lastError || !res) {
              resolve({ success: false, tabs: [], error: chrome.runtime.lastError?.message });
            } else {
              resolve(res);
            }
          });
        });

        if (response.success && Array.isArray(response.tabs) && response.tabs.length > 0) {
          return response.tabs;
        }
      } catch (e) {
        console.warn('Error querying tabs via background script:', e);
      }
    }

    // Fallback if running outside of extension context
    return [
      { id: 1, title: document.title || 'Current Webpage', url: window.location.href, active: true, pinned: false, windowId: 1 },
      { id: 2, title: 'GitHub — Hyperlink Architecture', url: 'https://github.com', active: false, pinned: true, windowId: 1 },
      { id: 3, title: 'WebGPU Specification & Examples', url: 'https://webgpu.io', active: false, pinned: false, windowId: 1 },
      { id: 4, title: 'Google Gemini 1.5 Flash Documentation', url: 'https://ai.google.dev', active: false, pinned: false, windowId: 1 },
    ];
  }

  async switchToTab(tabId: number, windowId?: number): Promise<boolean> {
    if (this.hasRuntime()) {
      return new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: 'TAB_SWITCH', tabId, windowId }, (res) => {
          resolve(!!res?.success);
        });
      });
    }
    return false;
  }

  async closeTab(tabId: number): Promise<boolean> {
    if (this.hasRuntime()) {
      return new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: 'TAB_CLOSE', tabId }, (res) => {
          resolve(!!res?.success);
        });
      });
    }
    return false;
  }

  async togglePin(tabId: number, pinned: boolean): Promise<boolean> {
    if (this.hasRuntime()) {
      return new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: 'TAB_TOGGLE_PIN', tabId, pinned }, (res) => {
          resolve(!!res?.success);
        });
      });
    }
    return false;
  }

  async toggleMute(tabId: number, muted: boolean): Promise<boolean> {
    if (this.hasRuntime()) {
      return new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: 'TAB_TOGGLE_MUTE', tabId, muted }, (res) => {
          resolve(!!res?.success);
        });
      });
    }
    return false;
  }

  async closeDuplicates(): Promise<number> {
    const tabs = await this.getAllTabs();
    const seenUrls = new Set<string>();
    const toClose: number[] = [];

    for (const tab of tabs) {
      if (!tab.url) continue;
      const cleanUrl = tab.url.split('#')[0];
      if (seenUrls.has(cleanUrl)) {
        toClose.push(tab.id);
      } else {
        seenUrls.add(cleanUrl);
      }
    }

    if (toClose.length > 0 && this.hasRuntime()) {
      await new Promise<boolean>((resolve) => {
        chrome.runtime.sendMessage({ type: 'TAB_CLOSE_MULTIPLE', tabIds: toClose }, (res) => {
          resolve(!!res?.success);
        });
      });
    }

    return toClose.length;
  }

  async createTab(url: string, active = false): Promise<void> {
    if (this.hasRuntime()) {
      await new Promise<void>((resolve) => {
        chrome.runtime.sendMessage({ type: 'TAB_CREATE', url, active }, () => {
          resolve();
        });
      });
    } else {
      window.open(url, '_blank');
    }
  }

  async saveCurrentSession(sessionName?: string): Promise<TabSession> {
    const tabs = await this.getAllTabs();
    const session: TabSession = {
      id: 'session_' + Date.now(),
      name: sessionName || `Session ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      timestamp: Date.now(),
      tabs: tabs.map(t => ({ title: t.title, url: t.url }))
    };

    const stored = this.getSavedSessions();
    localStorage.setItem('hyperlink_tab_sessions', JSON.stringify([session, ...stored]));
    return session;
  }

  getSavedSessions(): TabSession[] {
    try {
      const data = localStorage.getItem('hyperlink_tab_sessions');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  async restoreSession(sessionId: string): Promise<void> {
    const sessions = this.getSavedSessions();
    const target = sessions.find(s => s.id === sessionId);
    if (!target) return;

    for (const tab of target.tabs) {
      if (tab.url && !tab.url.startsWith('chrome://')) {
        await this.createTab(tab.url, false);
      }
    }
  }
}

export const tabService = new TabService();
