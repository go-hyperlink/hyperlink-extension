import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { readerModeService, CleanArticle } from '../../services/reader/readerModeService';
import { 
  BookOpen, 
  Copy, 
  FileDown, 
  X, 
  Check, 
  Sliders, 
  Type, 
  Maximize2,
  ExternalLink
} from 'lucide-react';

export const CleanReaderPanel: React.FC = () => {
  const { closeFeaturePanel, addToast } = useHyperlink();
  const [article, setArticle] = useState<CleanArticle | null>(null);
  const [fontSize, setFontSize] = useState<number>(18);
  const [fontFamily, setFontFamily] = useState<'serif' | 'sans' | 'mono'>('serif');
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [columnWidth, setColumnWidth] = useState<'standard' | 'wide' | 'full'>('standard');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const clean = readerModeService.extractArticle();
    setArticle(clean);

    // ESC key closes reader mode
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFeaturePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeFeaturePanel]);

  const themeStyles = {
    dark: {
      bg: 'bg-[#0b0f19]',
      headerBg: 'bg-[#0f1422]/95 border-white/[0.08]',
      cardBg: 'bg-[#111726]/60 border-white/[0.08]',
      text: 'text-zinc-100',
      secondaryText: 'text-zinc-400',
      headingBorder: 'border-white/15',
      codeBg: 'bg-black/40 text-emerald-400',
      blockquoteBorder: 'border-indigo-400',
    },
    sepia: {
      bg: 'bg-[#f8f1e3]',
      headerBg: 'bg-[#efe6d4]/95 border-[#dfd3bc]',
      cardBg: 'bg-[#efe6d4]/60 border-[#dfd3bc]',
      text: 'text-[#382b1d]',
      secondaryText: 'text-[#7d6951]',
      headingBorder: 'border-[#382b1d]/20',
      codeBg: 'bg-[#e7dcbf] text-[#2b2217]',
      blockquoteBorder: 'border-[#b58900]',
    },
    light: {
      bg: 'bg-[#ffffff]',
      headerBg: 'bg-white/95 border-zinc-200',
      cardBg: 'bg-zinc-50 border-zinc-200',
      text: 'text-zinc-900',
      secondaryText: 'text-zinc-500',
      headingBorder: 'border-zinc-200',
      codeBg: 'bg-zinc-100 text-zinc-900',
      blockquoteBorder: 'border-blue-500',
    }
  }[theme];

  const fontFamilyStyle = {
    serif: 'Georgia, "Times New Roman", Cambria, "Noto Serif", serif',
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  }[fontFamily];

  const columnWidthClass = {
    standard: 'max-w-3xl',
    wide: 'max-w-4xl',
    full: 'max-w-5xl'
  }[columnWidth];

  const handleCopyText = async () => {
    if (!article) return;
    await navigator.clipboard.writeText(article.textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('Article text copied to clipboard', 'success');
  };

  const handlePrint = () => {
    const host = document.getElementById('hyperlink-extension-overlay');
    const prevDisplay = host ? host.style.display : '';
    if (host) {
      host.style.display = 'none';
    }
    const cleanup = readerModeService.prepareCleanPrint();

    let restored = false;
    const restoreAll = () => {
      if (restored) return;
      restored = true;
      if (host) host.style.display = prevDisplay;
      cleanup();
      window.removeEventListener('afterprint', restoreAll);
      window.removeEventListener('focus', onFocus);
    };

    const onFocus = () => {
      setTimeout(restoreAll, 300);
    };

    window.addEventListener('afterprint', restoreAll, { once: true });
    window.addEventListener('focus', onFocus, { once: true });

    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div 
      className={`fixed inset-0 w-screen h-screen z-[2147483645] flex flex-col ${themeStyles.bg} ${themeStyles.text} select-text transition-colors duration-200 animate-hyperlink-fade`}
      style={{ margin: 0, padding: 0 }}
    >
      {/* Top Reader Controls Header Bar */}
      <header className={`h-14 px-6 border-b flex items-center justify-between backdrop-blur-xl shrink-0 ${themeStyles.headerBg} select-none`}>
        {/* Left Branding & Article Metadata */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 shrink-0">
            <BookOpen size={16} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-tight truncate">
                Clean Reader
              </h2>
              {article && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/10 opacity-80">
                  {article.readingTimeMinutes} min read
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Comprehensive Reading Controls */}
        <div className="flex items-center gap-4">
          {/* Text Size (A- / A+) */}
          <div className="flex items-center gap-1.5 bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setFontSize(prev => Math.max(13, prev - 1))}
              className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 hover:opacity-100 opacity-80 text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              title="Decrease text size"
            >
              A-
            </button>
            <span className="text-xs font-mono font-bold px-1.5 min-w-[40px] text-center">
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize(prev => Math.min(36, prev + 1))}
              className="w-7 h-7 rounded-lg bg-black/10 dark:bg-white/10 hover:opacity-100 opacity-80 text-xs font-bold transition-all cursor-pointer flex items-center justify-center"
              title="Increase text size"
            >
              A+
            </button>
          </div>

          {/* Typography Choice */}
          <div className="flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setFontFamily('serif')}
              className={`px-2.5 py-1 rounded-lg font-serif font-semibold transition-all cursor-pointer ${
                fontFamily === 'serif' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
            >
              Serif
            </button>
            <button
              onClick={() => setFontFamily('sans')}
              className={`px-2.5 py-1 rounded-lg font-sans font-semibold transition-all cursor-pointer ${
                fontFamily === 'sans' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
            >
              Sans
            </button>
            <button
              onClick={() => setFontFamily('mono')}
              className={`px-2.5 py-1 rounded-lg font-mono font-semibold transition-all cursor-pointer ${
                fontFamily === 'mono' ? 'bg-indigo-600 text-white shadow-sm' : 'opacity-70 hover:opacity-100'
              }`}
            >
              Mono
            </button>
          </div>

          {/* Column Width Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-black/10 dark:bg-white/5 p-1 rounded-xl border border-white/10 text-[11px] font-medium">
            <button
              onClick={() => setColumnWidth('standard')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                columnWidth === 'standard' ? 'bg-indigo-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              title="Standard reading column width"
            >
              Narrow
            </button>
            <button
              onClick={() => setColumnWidth('wide')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                columnWidth === 'wide' ? 'bg-indigo-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              title="Wide reading column width"
            >
              Medium
            </button>
            <button
              onClick={() => setColumnWidth('full')}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                columnWidth === 'full' ? 'bg-indigo-600 text-white font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              title="Full width column"
            >
              Wide
            </button>
          </div>

          {/* Theme Color Buttons */}
          <div className="flex items-center gap-2 pl-1 border-l border-white/15">
            <button
              onClick={() => setTheme('dark')}
              className={`w-6 h-6 rounded-full bg-[#0b0f19] border-2 transition-all cursor-pointer ${
                theme === 'dark' ? 'border-indigo-400 ring-2 ring-indigo-400/30 scale-110' : 'border-white/30'
              }`}
              title="Dark Obsidian Mode"
            />
            <button
              onClick={() => setTheme('sepia')}
              className={`w-6 h-6 rounded-full bg-[#f8f1e3] border-2 transition-all cursor-pointer ${
                theme === 'sepia' ? 'border-amber-600 ring-2 ring-amber-600/30 scale-110' : 'border-black/30'
              }`}
              title="Warm Sepia Mode"
            />
            <button
              onClick={() => setTheme('light')}
              className={`w-6 h-6 rounded-full bg-white border-2 transition-all cursor-pointer ${
                theme === 'light' ? 'border-blue-500 ring-2 ring-blue-500/30 scale-110' : 'border-zinc-300'
              }`}
              title="Paper Light Mode"
            />
          </div>
        </div>

        {/* Right Actions: Copy, Print & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyText}
            className="p-2 rounded-xl bg-black/10 dark:bg-white/5 hover:opacity-100 opacity-80 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Copy Clean Article Text"
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="p-2 rounded-xl bg-black/10 dark:bg-white/5 hover:opacity-100 opacity-80 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Print or Export as Clean PDF"
          >
            <FileDown size={14} />
            <span className="hidden md:inline">Print / PDF</span>
          </button>

          {/* Close Reader Mode Button */}
          <button
            onClick={closeFeaturePanel}
            className="p-2 ml-1 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 hover:text-red-300 transition-all cursor-pointer flex items-center gap-1 font-bold text-xs"
            title="Exit Reader Mode (Esc)"
          >
            <X size={16} />
            <span className="hidden sm:inline">Exit Reader</span>
          </button>
        </div>
      </header>

      {/* Main Full-Page Reading Area */}
      <main className="flex-1 overflow-y-auto px-6 py-12 scrollbar-thin">
        <article 
          className={`mx-auto ${columnWidthClass} leading-relaxed transition-all`}
          style={{ fontFamily: fontFamilyStyle }}
        >
          {article ? (
            <>
              {/* Dynamic Font Size and Article Style Injection */}
              <style>
                {`
                  .hyperlink-full-reader-body p {
                    font-size: ${fontSize}px !important;
                    line-height: 1.85 !important;
                    margin-bottom: 1.4em !important;
                  }
                  .hyperlink-full-reader-body span,
                  .hyperlink-full-reader-body li {
                    font-size: ${fontSize}px !important;
                    line-height: 1.8 !important;
                  }
                  .hyperlink-full-reader-body ul,
                  .hyperlink-full-reader-body ol {
                    margin-bottom: 1.4em !important;
                    padding-left: 1.8em !important;
                  }
                  .hyperlink-full-reader-body li {
                    margin-bottom: 0.5em !important;
                  }
                  .hyperlink-full-reader-body h1 {
                    font-size: ${Math.round(fontSize * 1.6)}px !important;
                    font-weight: 800 !important;
                    margin-top: 1.6em !important;
                    margin-bottom: 0.7em !important;
                    line-height: 1.3 !important;
                  }
                  .hyperlink-full-reader-body h2 {
                    font-size: ${Math.round(fontSize * 1.4)}px !important;
                    font-weight: 700 !important;
                    margin-top: 1.5em !important;
                    margin-bottom: 0.6em !important;
                    line-height: 1.35 !important;
                  }
                  .hyperlink-full-reader-body h3 {
                    font-size: ${Math.round(fontSize * 1.25)}px !important;
                    font-weight: 600 !important;
                    margin-top: 1.3em !important;
                    margin-bottom: 0.5em !important;
                  }
                  .hyperlink-full-reader-body blockquote {
                    border-left: 4px solid var(--hl-reader-border, #6366f1) !important;
                    padding-left: 1.2em !important;
                    font-style: italic !important;
                    opacity: 0.9 !important;
                    margin: 1.5em 0 !important;
                  }
                  .hyperlink-full-reader-body img {
                    max-width: 100% !important;
                    height: auto !important;
                    border-radius: 1rem !important;
                    margin: 2em auto !important;
                    display: block !important;
                    box-shadow: 0 10px 25px -5px rgba(0,0,0,0.15) !important;
                  }
                  .hyperlink-full-reader-body table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin: 1.8em 0 !important;
                  }
                  .hyperlink-full-reader-body th,
                  .hyperlink-full-reader-body td {
                    border: 1px solid rgba(128, 128, 128, 0.25) !important;
                    padding: 0.6em 0.8em !important;
                    font-size: ${Math.max(12, fontSize - 2)}px !important;
                  }
                `}
              </style>

              {/* Title Header */}
              <header className={`pb-6 mb-8 border-b ${themeStyles.headingBorder}`}>
                <h1 
                  className="font-extrabold tracking-tight pb-3"
                  style={{ fontSize: `${Math.round(fontSize * 1.85)}px`, lineHeight: 1.25 }}
                >
                  {article.title}
                </h1>

                <div className={`flex flex-wrap items-center gap-3 text-xs ${themeStyles.secondaryText}`}>
                  {article.byline && (
                    <span className="font-semibold">
                      By {article.byline}
                    </span>
                  )}
                  <span>•</span>
                  <span>{document.domain || window.location.hostname}</span>
                  <span>•</span>
                  <span>{article.readingTimeMinutes} min estimated reading time</span>
                </div>
              </header>

              {/* Clean Sanitized Body Text */}
              <div
                className="hyperlink-full-reader-body"
                dangerouslySetInnerHTML={{ __html: article.contentHtml }}
              />
            </>
          ) : (
            <div className="py-24 text-center space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto" />
              <p className="text-sm opacity-70">Sanitizing page for full distraction-free reading...</p>
            </div>
          )}
        </article>
      </main>
    </div>
  );
};
