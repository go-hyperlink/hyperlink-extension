import { SidebarFeatureId } from '../types';

export interface ParsedCommand {
  featureId: SidebarFeatureId;
  title: string;
  subtitle: string;
  category: string;
  iconName: string;
  extraArgs?: Record<string, any>;
  score: number;
}

export function parseNaturalLanguageCommand(query: string): ParsedCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: ParsedCommand[] = [];

  // 1. Summarization
  if (/summariz|summary|tl;?dr|digest|brief/i.test(q)) {
    results.push({
      featureId: 'summarize',
      title: 'Summarize Page',
      subtitle: 'Create a concise executive summary of this page',
      category: 'AI & Analysis',
      iconName: 'FileText',
      score: 95
    });
  }

  // 2. Explain / Define
  if (/explain|what is|what does|define|meaning/i.test(q)) {
    const term = q.replace(/explain|what is|what does|mean|define|the meaning of/gi, '').trim();
    results.push({
      featureId: 'ai',
      title: term ? `Explain "${term}"` : 'Explain in Plain English',
      subtitle: 'Analyze and clarify terms or concepts with AI',
      category: 'AI & Intelligence',
      iconName: 'Sparkles',
      extraArgs: { initialPrompt: q },
      score: 90
    });
  }

  // 3. Search / Find latest
  if (/search|find|google|look up|latest|current|recent/i.test(q)) {
    results.push({
      featureId: 'search',
      title: `Search: "${query.replace(/search|find|look up/gi, '').trim() || 'Topic'}"`,
      subtitle: 'Search the live web or current topic',
      category: 'Search & Web',
      iconName: 'Search',
      extraArgs: { query: query.replace(/search|find|look up/gi, '').trim() },
      score: 88
    });
  }

  // 4. Extraction
  if (/extract|scrape|pull|emails?|phones?|numbers?|links?|tables?|prices?/i.test(q)) {
    let mode = 'all';
    if (/email/i.test(q)) mode = 'emails';
    else if (/phone/i.test(q)) mode = 'phoneNumbers';
    else if (/link/i.test(q)) mode = 'links';
    else if (/price/i.test(q)) mode = 'prices';
    else if (/table/i.test(q)) mode = 'tables';

    results.push({
      featureId: 'extract',
      title: `Extract ${mode !== 'all' ? mode : 'Content'}`,
      subtitle: 'Scrape emails, links, tables, or prices from page',
      category: 'Tools & Utilities',
      iconName: 'Database',
      extraArgs: { mode },
      score: 92
    });
  }

  // 5. Screenshot / Capture
  if (/screenshot|capture|snip|image|screen grab/i.test(q)) {
    results.push({
      featureId: 'screenshot',
      title: 'Take Screenshot',
      subtitle: 'Capture visible viewport, area, or element',
      category: 'Capture',
      iconName: 'Camera',
      score: 94
    });
  }

  // 6. Screen Record
  if (/record|screen record|video capture/i.test(q)) {
    results.push({
      featureId: 'recorder',
      title: 'Record Screen / Tab',
      subtitle: 'Record tab or display with mic and system audio',
      category: 'Capture',
      iconName: 'Video',
      score: 93
    });
  }

  // 7. PDF
  if (/pdf|print|download page|save as pdf/i.test(q)) {
    results.push({
      featureId: 'pdf',
      title: 'Convert Page → PDF',
      subtitle: 'Clean printable PDF without ads or sidebars',
      category: 'Save & Export',
      iconName: 'FileDown',
      score: 91
    });
  }

  // 8. Read Aloud / TTS
  if (/read|speak|listen|voice|aloud|audio/i.test(q)) {
    results.push({
      featureId: 'reader',
      title: 'Read Aloud',
      subtitle: 'Listen to this page or selected text with speech highlighting',
      category: 'Media & Audio',
      iconName: 'Volume2',
      score: 89
    });
  }

  // 9. Clean / Reader Mode
  if (/clean|reader mode|distraction|reading view/i.test(q)) {
    results.push({
      featureId: 'clean',
      title: 'Clean Page / Reader View',
      subtitle: 'Distraction-free article reader mode',
      category: 'Tools',
      iconName: 'BookOpen',
      score: 87
    });
  }

  // 10. Translation
  if (/translate|language|spanish|french|german|chinese|japanese/i.test(q)) {
    results.push({
      featureId: 'translate',
      title: 'Translate Page / Selection',
      subtitle: 'Translate text or article into any language',
      category: 'Tools',
      iconName: 'Languages',
      score: 89
    });
  }

  // 11. Live Captions
  if (/caption|subtitles|transcribe/i.test(q)) {
    results.push({
      featureId: 'captions',
      title: 'Live Captions',
      subtitle: 'Real-time floating caption overlay for audio/video',
      category: 'Media',
      iconName: 'Captions',
      score: 88
    });
  }

  // 12. Video Tools
  if (/video|speed|pip|picture in picture|loop/i.test(q)) {
    results.push({
      featureId: 'video',
      title: 'Video Tools',
      subtitle: 'Speed control, PiP, loop, screenshot frame',
      category: 'Media',
      iconName: 'PlaySquare',
      score: 86
    });
  }

  // 13. Save / Bookmarking
  if (/save|bookmark|collection|star/i.test(q)) {
    results.push({
      featureId: 'save',
      title: 'Save to Collection',
      subtitle: 'Save page, note, or screenshot to organized collections',
      category: 'Save',
      iconName: 'Bookmark',
      score: 85
    });
  }

  // 14. Tab Manager
  if (/tab|close duplicate|session|manage tabs/i.test(q)) {
    results.push({
      featureId: 'tabs',
      title: 'Tab Manager',
      subtitle: 'Search, group, close duplicates, and save sessions',
      category: 'Browser',
      iconName: 'Layers',
      score: 86
    });
  }

  // 15. Developer Tools
  if (/dev|devtools|code|json|inspect|selector|css/i.test(q)) {
    results.push({
      featureId: 'devtools',
      title: 'Developer Tools',
      subtitle: 'Code explainer, JSON formatter, color picker, selectors',
      category: 'More',
      iconName: 'Terminal',
      score: 85
    });
  }

  // 16. Notes
  if (/note|notes|memo|notebook|jot|draft|write/i.test(q)) {
    results.push({
      featureId: 'notes',
      title: 'Notes & Notebook',
      subtitle: 'Create notes, clip page context, format with Markdown',
      category: 'Productivity',
      iconName: 'FileEdit',
      score: 95
    });
  }

  // 17. Media Downloader (Video & Audio)
  if (/download|video download|audio download|yt download|youtube download|mp3|mp4|stream download|rip/i.test(q)) {
    results.push({
      featureId: 'media_downloader',
      title: 'Media Downloader',
      subtitle: 'Download video & audio from YouTube, Twitter, and web media',
      category: 'Media & Download',
      iconName: 'Download',
      score: 96
    });
  }

  // 18. Settings
  if (/setting|settings|preference|preferences|config|api key|provider|setup/i.test(q)) {
    results.push({
      featureId: 'settings',
      title: 'System Settings',
      subtitle: 'AI providers, API keys, engines, and preferences',
      category: 'System',
      iconName: 'Settings',
      score: 94
    });
  }

  // 19. Theme / Dark Mode / Reading Mode
  if (/theme|dark|sepia|night|reading mode|contrast|amoled|midnight|grayscale|color|style/i.test(q)) {
    results.push({
      featureId: 'theme',
      title: 'Page Theme Studio',
      subtitle: 'Change website theme to Dark Mode, Sepia, AMOLED, or High Contrast',
      category: 'Display & Aesthetics',
      iconName: 'Palette',
      score: 96
    });
  }

  // If no direct command matched or as fallback, offer "Ask AI"
  if (results.length === 0) {
    results.push({
      featureId: 'ai',
      title: `Ask AI: "${query}"`,
      subtitle: 'Ask Hyperlink AI about this page or general questions',
      category: 'AI Assistant',
      iconName: 'Sparkles',
      extraArgs: { initialPrompt: query },
      score: 80
    });
    results.push({
      featureId: 'search',
      title: `Search Web for: "${query}"`,
      subtitle: 'Search external web providers',
      category: 'Web Search',
      iconName: 'Search',
      extraArgs: { query },
      score: 75
    });
  }

  return results.sort((a, b) => b.score - a.score);
}
