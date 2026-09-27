// Note Service: Note Taking & Page Clipping Storage Engine
// Manages local notes with Markdown support, page context association, and auto-saving.

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  url?: string;
  domain?: string;
  pageTitle?: string;
  tags: string[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = 'hyperlink_notes';

class NoteService {
  private listeners: Set<(notes: NoteItem[]) => void> = new Set();
  private cachedNotes: NoteItem[] | null = null;

  private hasChromeStorage(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage?.local;
  }

  async getNotes(): Promise<NoteItem[]> {
    if (this.cachedNotes) {
      return [...this.cachedNotes];
    }

    if (this.hasChromeStorage()) {
      try {
        const result = await chrome.storage.local.get(STORAGE_KEY);
        if (result && Array.isArray(result[STORAGE_KEY])) {
          this.cachedNotes = result[STORAGE_KEY];
          return [...this.cachedNotes];
        }
      } catch (e) {
        console.warn('[NoteService] Failed to load from chrome.storage.local:', e);
      }
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.cachedNotes = JSON.parse(stored);
        return [...(this.cachedNotes || [])];
      }
    } catch (e) {
      console.warn('[NoteService] LocalStorage read error:', e);
    }

    this.cachedNotes = [];
    return [];
  }

  async saveNote(data: Partial<NoteItem> & { title: string; content: string }): Promise<NoteItem> {
    const notes = await this.getNotes();
    const now = Date.now();

    let savedNote: NoteItem;

    if (data.id) {
      // Update existing note
      const index = notes.findIndex(n => n.id === data.id);
      if (index >= 0) {
        savedNote = {
          ...notes[index],
          ...data,
          updatedAt: now,
        };
        notes[index] = savedNote;
      } else {
        savedNote = {
          id: data.id,
          title: data.title || 'Untitled Note',
          content: data.content || '',
          url: data.url,
          domain: data.domain,
          pageTitle: data.pageTitle,
          tags: data.tags || [],
          pinned: data.pinned ?? false,
          createdAt: data.createdAt || now,
          updatedAt: now,
        };
        notes.unshift(savedNote);
      }
    } else {
      // Create new note
      savedNote = {
        id: 'note_' + now + '_' + Math.random().toString(36).substring(2, 7),
        title: data.title || 'Untitled Note',
        content: data.content || '',
        url: data.url,
        domain: data.domain,
        pageTitle: data.pageTitle,
        tags: data.tags || [],
        pinned: data.pinned ?? false,
        createdAt: now,
        updatedAt: now,
      };
      notes.unshift(savedNote);
    }

    await this.persist(notes);
    return savedNote;
  }

  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    const updated = notes.filter(n => n.id !== id);
    await this.persist(updated);
  }

  async togglePin(id: string): Promise<NoteItem | null> {
    const notes = await this.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) {
      note.pinned = !note.pinned;
      note.updatedAt = Date.now();
      await this.persist(notes);
      return note;
    }
    return null;
  }

  private async persist(notes: NoteItem[]): Promise<void> {
    this.cachedNotes = notes;
    if (this.hasChromeStorage()) {
      try {
        await chrome.storage.local.set({ [STORAGE_KEY]: notes });
      } catch (e) {
        console.warn('[NoteService] Failed to persist to chrome.storage.local:', e);
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (e) {
      console.warn('[NoteService] Failed to persist to localStorage:', e);
    }
    this.notify();
  }

  subscribe(listener: (notes: NoteItem[]) => void): () => void {
    this.listeners.add(listener);
    this.getNotes().then(notes => listener(notes));
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    if (this.cachedNotes) {
      const copy = [...this.cachedNotes];
      this.listeners.forEach(l => l(copy));
    }
  }
}

export const noteService = new NoteService();
