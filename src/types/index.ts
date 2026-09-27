// Hyperlink Core Types & Interfaces

export type PageContentType = 'normal' | 'video' | 'pdf' | 'shopping' | 'github' | 'article';

export interface PageMetadata {
  url: string;
  title: string;
  domain: string;
  description?: string;
  pageType: PageContentType;
  selectedText?: string;
  headings: string[];
  linksCount: number;
  imagesCount: number;
  hasVideo: boolean;
  videoUrl?: string;
  hasAudio: boolean;
  isPDF: boolean;
  articleText?: string;
  price?: string;
  author?: string;
}

export type SidebarFeatureId =
  | 'ai'
  | 'search'
  | 'summarize'
  | 'screenshot'
  | 'recorder'
  | 'video'
  | 'captions'
  | 'reader'
  | 'save'
  | 'pdf'
  | 'extract'
  | 'clean'
  | 'translate'
  | 'tabs'
  | 'devtools'
  | 'settings'
  | 'theme'
  | 'notes'
  | 'media_downloader';

export type SidebarSectionId = 'ai_search' | 'capture' | 'media' | 'save' | 'tools' | 'browser' | 'more';

export interface SidebarItemConfig {
  id: SidebarFeatureId;
  label: string;
  iconName: string;
  description: string;
  shortcut?: string;
  section: SidebarSectionId;
  badge?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  isLiveSearch?: boolean;
  actions?: Array<{ label: string; action: string }>;
}

export type AIProviderType = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'ollama' | 'builtin_mock';

export interface AIModelConfig {
  provider: AIProviderType;
  apiKey?: string;
  modelName: string;
  customEndpoint?: string;
  temperature?: number;
}

export interface ScreenshotCapture {
  id: string;
  dataUrl: string;
  timestamp: number;
  width: number;
  height: number;
  sourceUrl: string;
  pageTitle: string;
  cropArea?: { x: number; y: number; width: number; height: number };
}

export interface RecordingOptions {
  audio: boolean;
  mic: boolean;
  cursor: 'always' | 'motion' | 'never';
  mode: 'tab' | 'screen' | 'window';
}

export interface SavedItem {
  id: string;
  type: 'page' | 'selection' | 'screenshot' | 'ai_response' | 'transcript' | 'pdf' | 'article';
  title: string;
  content: string;
  url: string;
  domain: string;
  collection: string;
  timestamp: number;
  tags?: string[];
  thumbnail?: string;
}

export type SavedCollectionName =
  | 'Research'
  | 'Study'
  | 'Coding'
  | 'Work'
  | 'Ideas'
  | 'Shopping'
  | 'Watch Later';

export interface ExtractionResult {
  type: 'emails' | 'phoneNumbers' | 'links' | 'prices' | 'headings' | 'images' | 'tables' | 'dates';
  items: Array<any>;
  count: number;
  timestamp: number;
}

export interface UserSettings {
  aiConfig: AIModelConfig;
  defaultSearchEngine: 'google' | 'duckduckgo' | 'bing' | 'brave' | 'kagi' | 'perplexity';
  theme: 'dark' | 'light' | 'glass' | 'midnight';
  sidebarPosition: 'left' | 'right';
  sidebarWidth: number;
  collapsed: boolean;
  enableSelectionToolbar: boolean;
  enableFloatingTrigger: boolean;
  keyboardShortcut: string;
  liveCaptionsLanguage: string;
  readerFontSize: number;
  readerTheme: 'dark' | 'sepia' | 'light';
  privacyMode: boolean; // only send data on explicit user action
  collections: string[];
}

export interface CommandSuggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  action: () => void | Promise<void>;
  icon: string;
  shortcut?: string;
  matchScore?: number;
}
