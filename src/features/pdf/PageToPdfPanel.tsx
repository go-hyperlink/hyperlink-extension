import React, { useState } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { readerModeService } from '../../services/reader/readerModeService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';

export const PageToPdfPanel: React.FC = () => {
  const { pageContext, openFeatureWithProps, showToast } = useHyperlink();
  const [removeAds, setRemoveAds] = useState(true);
  const [removeNavs, setRemoveNavs] = useState(true);
  const [cleanTypography, setCleanTypography] = useState(true);
  const [pdfScope, setPdfScope] = useState<'entire' | 'article' | 'selection'>('article');

  const handleGeneratePdf = () => {
    // 1. Clean Article Scope: Opens formatted sanitized article in dedicated print window
    if (pdfScope === 'article') {
      showToast({ type: 'info', title: 'Formatting Clean Article PDF...' });
      const article = readerModeService.extractArticle();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${article.title} — PDF Export</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Georgia, serif;
                  line-height: 1.6;
                  color: #111;
                  max-width: 820px;
                  margin: 20px auto 40px;
                  padding: 0 20px;
                }
                .toolbar {
                  position: sticky;
                  top: 0;
                  z-index: 1000;
                  background: #090d1a;
                  color: #fff;
                  padding: 10px 16px;
                  border-radius: 14px;
                  border: 1px solid rgba(255,255,255,0.15);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 10px;
                  margin-bottom: 24px;
                  box-shadow: 0 10px 30px rgba(0,0,0,0.4);
                }
                .toolbar button {
                  padding: 6px 14px;
                  border-radius: 8px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                  display: inline-flex;
                  align-items: center;
                  gap: 6px;
                  transition: all 0.15s ease;
                }
                .btn-print {
                  background: #06b6d4;
                  color: #020617;
                  border: none;
                }
                .btn-print:hover { background: #22d3ee; }
                .btn-download {
                  background: rgba(255,255,255,0.1);
                  color: #fff;
                  border: 1px solid rgba(255,255,255,0.2);
                }
                .btn-download:hover { background: rgba(255,255,255,0.18); }
                .btn-close {
                  background: transparent;
                  color: #94a3b8;
                  border: none;
                }
                .btn-close:hover { color: #fff; }
                h1 { font-size: 28px; line-height: 1.25; margin-bottom: 8px; color: #0f172a; }
                .byline {
                  font-size: 13px;
                  color: #64748b;
                  margin-bottom: 24px;
                  padding-bottom: 12px;
                  border-bottom: 1px solid #e2e8f0;
                }
                .content { font-size: 16px; color: #1e293b; }
                .content p { margin-bottom: 16px; }
                .content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
                .content pre, .content code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 14px; }
                .content blockquote { border-left: 4px solid #06b6d4; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; }
                @media print {
                  .toolbar { display: none !important; }
                  body { max-width: 100%; margin: 0; padding: 15mm; }
                  @page { margin: 15mm; }
                }
              </style>
            </head>
            <body>
              <div class="toolbar">
                <div style="font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                  <span style="color: #06b6d4;">⚡</span>
                  <span>Hyperlink Clean Document</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
                  <button class="btn-download" onclick="downloadDoc()">📥 Download HTML</button>
                  <button class="btn-close" onclick="window.close()">✕</button>
                </div>
              </div>
              <h1>${article.title}</h1>
              <div class="byline">
                ${article.byline ? `Author: ${article.byline} • ` : ''}
                ${article.readingTimeMinutes} min read • Source: ${pageContext.url}
              </div>
              <div class="content">${article.contentHtml}</div>
              <script>
                function downloadDoc() {
                  var blob = new Blob([document.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
                  var a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = '${article.title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 40) || 'article'}.html';
                  a.click();
                }
                setTimeout(function() { window.print(); }, 250);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        showToast({ type: 'success', title: 'Clean PDF Print Window Opened' });
        return;
      }
    }

    // 2. Selection Scope: Prints selected text cleanly
    if (pdfScope === 'selection' && pageContext.selectedText) {
      showToast({ type: 'info', title: 'Printing Selection...' });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Selected Excerpt — ${pageContext.title}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", serif;
                  line-height: 1.6;
                  color: #111;
                  max-width: 760px;
                  margin: 20px auto 40px;
                  padding: 0 20px;
                }
                .toolbar {
                  position: sticky;
                  top: 0;
                  z-index: 1000;
                  background: #090d1a;
                  color: #fff;
                  padding: 10px 16px;
                  border-radius: 14px;
                  border: 1px solid rgba(255,255,255,0.15);
                  display: flex;
                  align-items: center;
                  justify-content: space-between;
                  gap: 10px;
                  margin-bottom: 24px;
                }
                .toolbar button {
                  padding: 6px 14px;
                  border-radius: 8px;
                  font-size: 12px;
                  font-weight: 600;
                  cursor: pointer;
                }
                .btn-print { background: #06b6d4; color: #020617; border: none; }
                .btn-download { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); }
                h2 { font-size: 20px; margin-bottom: 6px; color: #0f172a; }
                .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                blockquote {
                  border-left: 4px solid #06b6d4;
                  padding: 12px 16px;
                  margin: 0;
                  background: #f8fafc;
                  border-radius: 4px;
                  font-size: 15px;
                  white-space: pre-wrap;
                }
                @media print {
                  .toolbar { display: none !important; }
                  body { max-width: 100%; margin: 0; padding: 15mm; }
                }
              </style>
            </head>
            <body>
              <div class="toolbar">
                <span style="font-size: 12px; font-weight: bold;">⚡ Hyperlink Selection</span>
                <div style="display: flex; gap: 8px;">
                  <button class="btn-print" onclick="window.print()">🖨️ Save as PDF / Print</button>
                  <button class="btn-download" onclick="downloadDoc()">📥 Download HTML</button>
                </div>
              </div>
              <h2>Excerpt from: ${pageContext.title}</h2>
              <div class="meta">URL: ${pageContext.url} • Printed via Hyperlink</div>
              <blockquote>${pageContext.selectedText}</blockquote>
              <script>
                function downloadDoc() {
                  var blob = new Blob([document.documentElement.outerHTML], { type: 'text/html;charset=utf-8' });
                  var a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = 'excerpt.html';
                  a.click();
                }
                setTimeout(function() { window.print(); }, 250);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        showToast({ type: 'success', title: 'Selection PDF Window Opened' });
        return;
      }
    }

    // 3. Full Page Scope: Sanitizes the host page and completely hides the Hyperlink overlay during print
    showToast({ type: 'info', title: 'Preparing Clean Page PDF...' });

    const host = document.getElementById('hyperlink-extension-overlay');
    const prevDisplay = host ? host.style.display : '';

    // Hide overlay completely so it NEVER covers the printed page
    if (host) {
      host.style.display = 'none';
    }

    // Inject temporary sanitized print stylesheet
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
      showToast({ type: 'success', title: 'PDF Print Dialog Opened' });
    }, 150);
  };

  const handleDownloadFile = () => {
    let title = pageContext.title || 'Page';
    let htmlContent = '';

    if (pdfScope === 'article') {
      const article = readerModeService.extractArticle();
      title = article.title || title;
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${article.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Georgia, serif; line-height: 1.6; color: #111; max-width: 820px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 28px; line-height: 1.25; margin-bottom: 8px; color: #0f172a; }
    .byline { font-size: 13px; color: #64748b; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
    .content { font-size: 16px; color: #1e293b; }
    .content p { margin-bottom: 16px; }
    .content img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; }
    .content blockquote { border-left: 4px solid #06b6d4; padding-left: 16px; margin: 16px 0; color: #475569; font-style: italic; }
    @media print { body { max-width: 100%; margin: 0; padding: 15mm; } }
  </style>
</head>
<body>
  <h1>${article.title}</h1>
  <div class="byline">${article.byline ? `Author: ${article.byline} • ` : ''}${article.readingTimeMinutes} min read • Source: ${pageContext.url}</div>
  <div class="content">${article.contentHtml}</div>
</body>
</html>`;
    } else if (pdfScope === 'selection' && pageContext.selectedText) {
      htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Selected Excerpt — ${pageContext.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", serif; line-height: 1.6; color: #111; max-width: 760px; margin: 40px auto; padding: 0 20px; }
    h2 { font-size: 20px; margin-bottom: 6px; color: #0f172a; }
    .meta { font-size: 12px; color: #64748b; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
    blockquote { border-left: 4px solid #06b6d4; padding: 12px 16px; margin: 0; background: #f8fafc; border-radius: 4px; font-size: 15px; white-space: pre-wrap; }
    @media print { body { max-width: 100%; margin: 0; padding: 15mm; } }
  </style>
</head>
<body>
  <h2>Excerpt from: ${pageContext.title}</h2>
  <div class="meta">URL: ${pageContext.url} • Generated via Hyperlink</div>
  <blockquote>${pageContext.selectedText}</blockquote>
</body>
</html>`;
    } else {
      const clone = document.documentElement.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('#hyperlink-extension-overlay, .hyperlink-selection-toolbar').forEach(e => e.remove());
      htmlContent = `<!DOCTYPE html>\n${clone.outerHTML}`;
    }

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = title.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 50) || 'document';
    a.download = `${safeTitle}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast({
      type: 'success',
      title: 'Clean Document Downloaded',
      message: `Saved ${a.download} — Can be opened in any browser and saved as PDF.`
    });
  };

  const handleSaveToHyperlink = () => {
    openFeatureWithProps('save', {
      type: 'pdf',
      title: `PDF Archive: ${pageContext.title}`,
      initialText: `Generated clean PDF reference for ${pageContext.url} on ${new Date().toLocaleDateString()}`
    });
  };

  return (
    <PanelContainer
      title="Page → PDF"
      iconName="FileDown"
      subtitle="Sanitized, ad-free printable layout generator"
    >
      <div className="space-y-4">
        {/* Scope Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-300">Conversion Scope</label>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => setPdfScope('article')}
              className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                pdfScope === 'article'
                  ? 'bg-indigo-500/20 border-indigo-400/40 text-white shadow-sm shadow-indigo-500/10'
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              Clean Article
            </button>
            <button
              onClick={() => setPdfScope('entire')}
              className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                pdfScope === 'entire'
                  ? 'bg-indigo-500/20 border-indigo-400/40 text-white shadow-sm shadow-indigo-500/10'
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white'
              }`}
            >
              Full Page
            </button>
            <button
              onClick={() => setPdfScope('selection')}
              disabled={!pageContext.selectedText}
              className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                pdfScope === 'selection'
                  ? 'bg-indigo-500/20 border-indigo-400/40 text-white shadow-sm shadow-indigo-500/10'
                  : 'bg-white/[0.03] border-white/[0.06] text-zinc-400 hover:text-white disabled:opacity-30'
              }`}
            >
              Selection
            </button>
          </div>
        </div>

        {/* Sanitization Options */}
        <div className="p-3.5 rounded-2xl bg-white/[0.035] border border-white/[0.08] space-y-2.5">
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Sanitization Rules
          </span>

          <label className="flex items-center justify-between cursor-pointer text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <HyperlinkIcon name="Shield" size={14} className="text-emerald-400" />
              Remove Ads & Sticky Banners
            </span>
            <input
              type="checkbox"
              checked={removeAds}
              onChange={(e) => setRemoveAds(e.target.checked)}
              className="accent-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <HyperlinkIcon name="Navigation" size={14} className="text-indigo-400" />
              Remove Navbars & Footers
            </span>
            <input
              type="checkbox"
              checked={removeNavs}
              onChange={(e) => setRemoveNavs(e.target.checked)}
              className="accent-indigo-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-xs text-zinc-300">
            <span className="flex items-center gap-2">
              <HyperlinkIcon name="Type" size={14} className="text-violet-400" />
              Optimized Print Typography
            </span>
            <input
              type="checkbox"
              checked={cleanTypography}
              onChange={(e) => setCleanTypography(e.target.checked)}
              className="accent-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        {/* Info Box */}
        <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs text-zinc-300">
          <p className="text-[11px] leading-relaxed text-zinc-300">
            💡 Hyperlink automatically hides its overlay before opening the browser print preview so your PDF is clean and unobstructed. In the print dialog, select Destination: <strong>"Save as PDF"</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <HyperlinkButton
              onClick={handleDownloadFile}
              variant="primary"
              icon="Download"
              className="justify-center py-2.5"
            >
              Download Clean Doc
            </HyperlinkButton>

            <HyperlinkButton
              onClick={handleGeneratePdf}
              variant="secondary"
              icon="Printer"
              className="justify-center py-2.5"
            >
              Save as PDF (Print)
            </HyperlinkButton>
          </div>

          <HyperlinkButton
            onClick={handleSaveToHyperlink}
            variant="secondary"
            icon="Bookmark"
            className="w-full justify-center"
          >
            Bookmark PDF Reference
          </HyperlinkButton>
        </div>
      </div>
    </PanelContainer>
  );
};
