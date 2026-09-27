// Extraction Service: Scrapes & patterns DOM for structured entities

export interface ExtractedEmail {
  email: string;
  sourceContext?: string;
}

export interface ExtractedLink {
  text: string;
  url: string;
  isInternal: boolean;
}

export interface ExtractedPrice {
  price: string;
  currency: string;
  rawText: string;
}

export interface ExtractedImage {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  filename: string;
  format: string;
}

export interface ExtractedTable {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
  rowCount: number;
  colCount: number;
}

class ExtractorService {
  /**
   * Extract all email addresses from page body
   */
  extractEmails(): ExtractedEmail[] {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    let text = document.body.innerText;
    if (overlay) {
      // Clone body and remove overlay for clean text
      try {
        const clone = document.body.cloneNode(true) as HTMLElement;
        const ov = clone.querySelector('#hyperlink-extension-overlay');
        if (ov) ov.remove();
        text = clone.innerText;
      } catch {}
    }

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const matches = text.match(emailRegex) || [];
    const unique = Array.from(new Set(matches.map(m => m.toLowerCase())));

    return unique.map(email => ({
      email,
      sourceContext: this.findNearbyContext(email, text)
    }));
  }

  /**
   * Extract phone numbers
   */
  extractPhoneNumbers(): string[] {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    let text = document.body.innerText;
    if (overlay) {
      try {
        const clone = document.body.cloneNode(true) as HTMLElement;
        const ov = clone.querySelector('#hyperlink-extension-overlay');
        if (ov) ov.remove();
        text = clone.innerText;
      } catch {}
    }

    const phoneRegex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/gi;
    const matches = text.match(phoneRegex) || [];
    return Array.from(new Set(matches.map(p => p.trim()).filter(p => p.length >= 7)));
  }

  /**
   * Extract all hyperlinks
   */
  extractLinks(): ExtractedLink[] {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const currentHost = window.location.hostname;
    const results: ExtractedLink[] = [];
    const seen = new Set<string>();

    for (const a of anchors) {
      if (overlay && overlay.contains(a)) continue;
      const href = (a as HTMLAnchorElement).href;
      if (!href || href.startsWith('javascript:') || href.startsWith('#') || seen.has(href)) continue;
      seen.add(href);

      try {
        const urlObj = new URL(href);
        results.push({
          text: (a.textContent || '').trim().replace(/\s+/g, ' ') || href,
          url: href,
          isInternal: urlObj.hostname === currentHost
        });
      } catch {}
    }

    return results;
  }

  /**
   * Extract prices and currencies
   */
  extractPrices(): ExtractedPrice[] {
    const text = document.body.innerText;
    const priceRegex = /([$€£¥₹]\s?[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?\s?(?:USD|EUR|GBP|CAD|AUD|INR))/gi;
    const matches = text.match(priceRegex) || [];
    const unique = Array.from(new Set(matches.map(p => p.trim())));

    return unique.map(p => {
      let currency = 'USD';
      if (p.includes('€')) currency = 'EUR';
      else if (p.includes('£')) currency = 'GBP';
      else if (p.includes('₹')) currency = 'INR';
      else if (p.includes('¥')) currency = 'JPY';
      return {
        price: p,
        currency,
        rawText: p
      };
    });
  }

  /**
   * Extract heading hierarchy (H1 - H6)
   */
  extractHeadings(): Array<{ level: number; text: string }> {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    return headingElements
      .filter(el => !overlay || !overlay.contains(el))
      .map(el => ({
        level: parseInt(el.tagName.substring(1), 10),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim()
      }))
      .filter(h => h.text.length > 0);
  }

  /**
   * Extract images with dimension and filename metadata
   */
  extractImages(): ExtractedImage[] {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    const imgs = Array.from(document.querySelectorAll('img[src]'));
    const results: ExtractedImage[] = [];
    const seen = new Set<string>();

    for (const img of imgs) {
      if (overlay && overlay.contains(img)) continue;
      const htmlImg = img as HTMLImageElement;
      const src = htmlImg.currentSrc || htmlImg.src;
      if (!src || src.startsWith('data:') || seen.has(src)) continue;
      seen.add(src);

      let filename = '';
      try {
        const urlObj = new URL(src);
        const parts = urlObj.pathname.split('/');
        filename = parts[parts.length - 1] || '';
      } catch {}

      if (!filename || filename.length < 3) {
        filename = `image_${results.length + 1}.png`;
      }
      filename = filename.split('?')[0].split('#')[0];

      const ext = filename.split('.').pop()?.toLowerCase() || 'png';
      const format = ['jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'avif'].includes(ext) ? ext.toUpperCase() : 'IMG';

      results.push({
        src,
        alt: htmlImg.alt || filename,
        width: htmlImg.naturalWidth || htmlImg.width,
        height: htmlImg.naturalHeight || htmlImg.height,
        filename,
        format
      });
    }

    return results;
  }

  /**
   * Extract HTML tables safely with clean headers and rows
   */
  extractTables(): ExtractedTable[] {
    const overlay = document.getElementById('hyperlink-extension-overlay');
    const allTables = Array.from(document.querySelectorAll('table'));
    const tables = allTables.filter(t => !overlay || !overlay.contains(t));
    const results: ExtractedTable[] = [];

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      let title = table.querySelector('caption')?.textContent?.trim() ||
                  table.getAttribute('aria-label') ||
                  table.getAttribute('summary') ||
                  '';
      if (!title) {
        let prev = table.previousElementSibling;
        while (prev && !title) {
          if (/^H[1-6]$/i.test(prev.tagName)) {
            title = prev.textContent?.trim() || '';
          }
          prev = prev.previousElementSibling;
        }
      }
      if (!title) {
        title = `Table ${i + 1}`;
      }

      // Extract headers
      let headers: string[] = Array.from(table.querySelectorAll('thead th, thead td'))
        .map(th => (th.textContent || '').replace(/\s+/g, ' ').trim());

      if (headers.length === 0) {
        headers = Array.from(table.querySelectorAll('tr:first-child th'))
          .map(th => (th.textContent || '').replace(/\s+/g, ' ').trim());
      }

      // Extract rows
      let rowElements = Array.from(table.querySelectorAll('tbody tr'));
      if (rowElements.length === 0) {
        rowElements = Array.from(table.querySelectorAll('tr'));
      }

      let rows: string[][] = [];
      const hasExplicitHeaders = headers.length > 0;

      for (let rIdx = 0; rIdx < rowElements.length; rIdx++) {
        const tr = rowElements[rIdx];
        if (hasExplicitHeaders && tr.parentElement?.tagName.toLowerCase() === 'thead') continue;
        if (hasExplicitHeaders && tr.querySelectorAll('th').length > 0 && tr.querySelectorAll('td').length === 0) continue;

        const cells = Array.from(tr.querySelectorAll('td, th')).map(td =>
          (td.textContent || '').replace(/\s+/g, ' ').trim()
        );

        if (cells.length === 0 || cells.every(c => !c)) continue;

        if (!hasExplicitHeaders && headers.length === 0 && rowElements.length > 1 && rIdx === 0) {
          headers = cells;
        } else {
          rows.push(cells);
        }
      }

      const colCount = Math.max(headers.length, ...(rows.map(r => r.length)), 0);
      if (headers.length === 0 && colCount > 0) {
        headers = Array.from({ length: colCount }, (_, idx) => `Col ${idx + 1}`);
      }

      // Normalize row widths
      rows = rows.map(row => {
        const padded = [...row];
        while (padded.length < colCount) padded.push('');
        return padded.slice(0, colCount);
      });

      if (rows.length > 0 || headers.length > 0) {
        results.push({
          id: `table_${i + 1}`,
          title,
          headers,
          rows,
          rowCount: rows.length,
          colCount: headers.length
        });
      }
    }

    return results;
  }

  /**
   * Convert a single ExtractedTable to CSV string
   */
  tableToCSV(table: ExtractedTable): string {
    const escapeCsv = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
    const lines: string[] = [];
    if (table.headers && table.headers.length > 0) {
      lines.push(table.headers.map(escapeCsv).join(','));
    }
    if (table.rows && table.rows.length > 0) {
      for (const row of table.rows) {
        lines.push(row.map(escapeCsv).join(','));
      }
    }
    return lines.join('\n');
  }

  /**
   * Convert all ExtractedTable[] to combined CSV string
   */
  tablesToCSV(tables: ExtractedTable[]): string {
    return tables.map(t => `# === ${t.title} ===\n` + this.tableToCSV(t)).join('\n\n');
  }

  /**
   * Find 60 characters around match
   */
  private findNearbyContext(match: string, fullText: string): string {
    const idx = fullText.indexOf(match);
    if (idx === -1) return '';
    const start = Math.max(0, idx - 40);
    const end = Math.min(fullText.length, idx + match.length + 40);
    return '...' + fullText.substring(start, end).replace(/\s+/g, ' ').trim() + '...';
  }

  /**
   * Export extracted data array to CSV string
   */
  toCSV(data: any[]): string {
    if (!data.length) return '';
    const keys = Object.keys(data[0]);
    const headerRow = keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',');
    const rows = data.map(item =>
      keys.map(k => {
        const val = item[k] !== undefined && item[k] !== null ? String(item[k]) : '';
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [headerRow, ...rows].join('\n');
  }

  /**
   * Download a single image with filename
   */
  async downloadImage(image: ExtractedImage): Promise<boolean> {
    const cleanFilename = image.filename.replace(/[^a-zA-Z0-9._-]/g, '_') || `image_${Date.now()}.png`;

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        const res = await new Promise<any>((resolve) => {
          chrome.runtime.sendMessage(
            { type: 'DOWNLOAD_FILE', url: image.src, filename: cleanFilename },
            resolve
          );
        });
        if (res && res.success) return true;
      } catch {}
    }

    // Direct browser fallback
    try {
      const response = await fetch(image.src, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return true;
    } catch {
      // Simple anchor click fallback
      const a = document.createElement('a');
      a.href = image.src;
      a.download = cleanFilename;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  }

  /**
   * Download all extracted images (Combined download)
   */
  async downloadAllImages(
    images: ExtractedImage[],
    onProgress?: (current: number, total: number) => void
  ): Promise<number> {
    let successCount = 0;
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const ok = await this.downloadImage(img);
      if (ok) successCount++;
      if (onProgress) onProgress(i + 1, images.length);
      // Small pause between downloads to prevent browser flooding
      await new Promise(r => setTimeout(r, 250));
    }
    return successCount;
  }

  /**
   * Download text content as a file
   */
  download(content: string, filename: string, type: 'csv' | 'json' | 'txt') {
    const mimeTypes = {
      csv: 'text/csv;charset=utf-8;',
      json: 'application/json;charset=utf-8;',
      txt: 'text/plain;charset=utf-8;'
    };
    const blob = new Blob([content], { type: mimeTypes[type] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export const extractorService = new ExtractorService();
