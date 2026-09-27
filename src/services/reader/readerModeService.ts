// Reader Mode & Article Clean Service

export interface CleanArticle {
  title: string;
  byline?: string;
  excerpt?: string;
  contentHtml: string;
  textContent: string;
  readingTimeMinutes: number;
}

class ReaderModeService {
  /**
   * Extract readable article content from the current document
   */
  extractArticle(): CleanArticle {
    const title = document.title || 'Untitled Article';
    let author = '';
    const authorEl = document.querySelector('meta[name="author"], .author, [rel="author"]');
    if (authorEl) {
      author = (authorEl as HTMLMetaElement).content || (authorEl.textContent || '').trim();
    }

    // Try common article container selectors
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-body',
      '.entry-content',
      '#content',
      '.content'
    ];

    let targetContainer: HTMLElement | null = null;
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 300) {
        targetContainer = el as HTMLElement;
        break;
      }
    }

    if (!targetContainer) {
      targetContainer = document.body;
    }

    // Clone container so we don't mutate host page
    const clone = targetContainer.cloneNode(true) as HTMLElement;

    // Strip unwanted elements
    const removeSelectors = [
      'script',
      'style',
      'noscript',
      'iframe',
      'header',
      'nav',
      'footer',
      '.ad',
      '.advertisement',
      '.social-share',
      '.comments',
      '#comments',
      '.sidebar',
      'aside'
    ];

    removeSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });

    const textContent = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).filter(Boolean).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 220));

    return {
      title,
      byline: author,
      contentHtml: clone.innerHTML,
      textContent,
      readingTimeMinutes
    };
  }

  /**
   * Prepare document for clean print / PDF generation without ads, nav, sidebars
   */
  prepareCleanPrint(): () => void {
    const printStyle = document.createElement('style');
    printStyle.id = 'hyperlink-clean-print-style';
    printStyle.textContent = `
      @media print {
        header, nav, footer, aside, .sidebar, .ad, .ads, [role="banner"], [role="navigation"] {
          display: none !important;
        }
        body {
          background: #fff !important;
          color: #000 !important;
          font-family: serif !important;
          font-size: 12pt !important;
          line-height: 1.5 !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        a {
          color: #000 !important;
          text-decoration: underline !important;
        }
      }
    `;
    document.head.appendChild(printStyle);

    return () => {
      printStyle.remove();
    };
  }
}

export const readerModeService = new ReaderModeService();
