// Screenshot Service: Clean Viewport & Interactive Area Capture
// Automatically hides Hyperlink overlay during capture to ensure 100% clean images.

export interface CaptureArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

class ScreenshotService {
  /**
   * Request visible tab screenshot from background service worker,
   * hiding the Hyperlink overlay during the capture so it is never in the screenshot.
   */
  async captureViewport(): Promise<string> {
    const host = document.getElementById('hyperlink-extension-overlay');
    const dragOverlay = document.getElementById('hyperlink-screenshot-drag-overlay');
    const floatingTrigger = document.getElementById('hyperlink-floating-trigger');

    const prevHostDisplay = host ? host.style.display : '';
    const prevHostVisibility = host ? host.style.visibility : '';
    const prevTriggerDisplay = floatingTrigger ? floatingTrigger.style.display : '';
    const prevDragDisplay = dragOverlay ? dragOverlay.style.display : '';

    // 1. Temporarily hide Hyperlink overlay and any toolbars completely
    if (host) {
      host.style.display = 'none';
      host.style.visibility = 'hidden';
    }
    if (floatingTrigger) {
      floatingTrigger.style.display = 'none';
    }
    if (dragOverlay) {
      dragOverlay.style.display = 'none';
    }

    // 2. Wait 140ms for browser compositor to render the clean webpage
    await new Promise(r => setTimeout(r, 140));

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.sendMessage) {
        const response = await new Promise<any>((resolve, reject) => {
          chrome.runtime.sendMessage(
            { type: 'CAPTURE_TAB', action: 'CAPTURE_TAB' },
            (res) => {
              if (chrome.runtime.lastError) {
                console.error('[ScreenshotService] captureVisibleTab runtime error:', chrome.runtime.lastError);
                reject(new Error(chrome.runtime.lastError.message || 'Capture failed'));
              } else if (res && res.error) {
                console.error('[ScreenshotService] captureVisibleTab response error:', res.error);
                reject(new Error(res.error));
              } else if (res && res.dataUrl) {
                resolve(res);
              } else {
                reject(new Error('Capture returned empty image'));
              }
            }
          );
        });

        if (response && response.dataUrl) {
          return response.dataUrl;
        }
      }
      return this.generateMockCapture('Viewport Capture');
    } finally {
      // 3. Restore Hyperlink overlay visibility
      if (host) {
        host.style.display = prevHostDisplay === 'none' ? '' : prevHostDisplay;
        host.style.visibility = prevHostVisibility === 'hidden' ? '' : prevHostVisibility;
      }
      if (floatingTrigger) {
        floatingTrigger.style.display = prevTriggerDisplay;
      }
      if (dragOverlay) {
        dragOverlay.style.display = prevDragDisplay;
      }
    }
  }

  /**
   * Interactive area screenshot tool:
   * Lets the user drag a selection box on the screen, captures the viewport,
   * and returns the cleanly cropped section.
   */
  async captureAreaInteractive(): Promise<string> {
    const host = document.getElementById('hyperlink-extension-overlay');
    const prevDisplay = host ? host.style.display : '';
    const prevVisibility = host ? host.style.visibility : '';
    if (host) {
      host.style.display = 'none';
      host.style.visibility = 'hidden';
    }

    const selectedArea = await new Promise<CaptureArea | null>((resolve) => {
      // Create overlay for dragging
      const dragOverlay = document.createElement('div');
      dragOverlay.id = 'hyperlink-screenshot-drag-overlay';
      Object.assign(dragOverlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        zIndex: '2147483647',
        cursor: 'crosshair',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        userSelect: 'none',
      });

      // Box element
      const box = document.createElement('div');
      Object.assign(box.style, {
        position: 'fixed',
        border: '2px solid #06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        display: 'none',
        pointerEvents: 'none',
        zIndex: '2147483647',
        borderRadius: '4px',
        boxShadow: '0 0 0 99999px rgba(0, 0, 0, 0.4)',
      });
      dragOverlay.appendChild(box);

      // Dimension badge
      const badge = document.createElement('div');
      Object.assign(badge.style, {
        position: 'absolute',
        bottom: '-24px',
        right: '0',
        background: '#06b6d4',
        color: '#020617',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '2px 6px',
        borderRadius: '4px',
        fontFamily: 'monospace',
      });
      box.appendChild(badge);

      let startX = 0;
      let startY = 0;
      let isDragging = false;

      const onMouseDown = (e: MouseEvent) => {
        startX = e.clientX;
        startY = e.clientY;
        isDragging = true;
        box.style.left = `${startX}px`;
        box.style.top = `${startY}px`;
        box.style.width = '0px';
        box.style.height = '0px';
        box.style.display = 'block';
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        box.style.left = `${left}px`;
        box.style.top = `${top}px`;
        box.style.width = `${width}px`;
        box.style.height = `${height}px`;
        badge.textContent = `${Math.round(width)} × ${Math.round(height)}`;
      };

      const cleanup = () => {
        window.removeEventListener('keydown', onKeyDown);
        if (dragOverlay.parentNode) {
          dragOverlay.parentNode.removeChild(dragOverlay);
        }
      };

      const onMouseUp = (e: MouseEvent) => {
        if (!isDragging) return;
        isDragging = false;
        const left = Math.min(startX, e.clientX);
        const top = Math.min(startY, e.clientY);
        const width = Math.abs(e.clientX - startX);
        const height = Math.abs(e.clientY - startY);

        cleanup();

        if (width > 15 && height > 15) {
          resolve({ x: left, y: top, width, height });
        } else {
          resolve(null); // Too small or misclick
        }
      };

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          cleanup();
          resolve(null);
        }
      };

      dragOverlay.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('keydown', onKeyDown);

      document.body.appendChild(dragOverlay);
    });

    if (!selectedArea) {
      if (host) {
        host.style.display = prevDisplay === 'none' ? '' : prevDisplay;
        host.style.visibility = prevVisibility === 'hidden' ? '' : prevVisibility;
      }
      throw new Error('Area selection was cancelled or was too small.');
    }

    try {
      // Capture clean viewport
      const viewportUrl = await this.captureViewport();

      // Scale coordinates according to devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      return await this.cropImage(viewportUrl, {
        x: selectedArea.x * dpr,
        y: selectedArea.y * dpr,
        width: selectedArea.width * dpr,
        height: selectedArea.height * dpr,
      });
    } finally {
      if (host) {
        host.style.display = prevDisplay === 'none' ? '' : prevDisplay;
        host.style.visibility = prevVisibility === 'hidden' ? '' : prevVisibility;
      }
    }
  }

  /**
   * Crop a base64 image according to defined coordinates
   */
  async cropImage(base64: string, area: CaptureArea): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, area.width);
        canvas.height = Math.max(1, area.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(
            img,
            area.x,
            area.y,
            area.width,
            area.height,
            0,
            0,
            area.width,
            area.height
          );
          resolve(canvas.toDataURL('image/png'));
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  }

  /**
   * Copy image to user's system clipboard
   */
  async copyToClipboard(dataUrl: string): Promise<boolean> {
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    } catch (e) {
      console.warn('Clipboard write failed:', e);
      return false;
    }
  }

  /**
   * Trigger direct file download
   */
  downloadImage(dataUrl: string, filename: string = 'hyperlink-screenshot.png'): void {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  /**
   * Generates a sleek screenshot placeholder if outside extension runtime
   */
  private generateMockCapture(title: string): string {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, 1280, 720);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Grid pattern
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 1280; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 720);
      ctx.stroke();
    }
    for (let y = 0; y < 720; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1280, y);
      ctx.stroke();
    }

    // Glass card in center
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(140, 100, 1000, 520, 20);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('⚡ HYPERLINK CAPTURE', 200, 220);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '22px sans-serif';
    ctx.fillText(title + ' — ' + document.title, 200, 270);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '16px monospace';
    ctx.fillText('URL: ' + window.location.href, 200, 310);
    ctx.fillText('Timestamp: ' + new Date().toLocaleString(), 200, 340);

    return canvas.toDataURL('image/png');
  }
}

export const screenshotService = new ScreenshotService();
