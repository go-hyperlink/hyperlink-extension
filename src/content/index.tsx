import React from 'react';
import { createRoot } from 'react-dom/client';
import { HyperlinkProvider } from '../context/HyperlinkContext';
import { OverlayApp } from './OverlayApp';

function initHyperlink() {
  const HOST_ID = 'hyperlink-extension-overlay';

  // Prevent multiple injections
  if (document.getElementById(HOST_ID)) {
    return;
  }

  // Create isolated container
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '0';
  host.style.width = '0';
  host.style.height = '0';
  host.style.zIndex = '2147483640';
  host.style.overflow = 'visible';

  // Inject global print guard so browser print engine NEVER prints Hyperlink overlay
  if (!document.getElementById('hyperlink-print-guard-style')) {
    const printGuard = document.createElement('style');
    printGuard.id = 'hyperlink-print-guard-style';
    printGuard.textContent = `
      @media print {
        #hyperlink-extension-overlay,
        #hyperlink-extension-overlay *,
        .hyperlink-selection-toolbar,
        #hyperlink-screenshot-drag-overlay {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          pointer-events: none !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(printGuard);
  }

  // Register browser native print hooks to hide overlay before print snapshot
  window.addEventListener('beforeprint', () => {
    const el = document.getElementById(HOST_ID);
    if (el) {
      el.style.display = 'none';
      el.style.visibility = 'hidden';
    }
  });

  window.addEventListener('afterprint', () => {
    const el = document.getElementById(HOST_ID);
    if (el) {
      el.style.display = '';
      el.style.visibility = '';
    }
  });

  // Attach Open Shadow DOM for 100% CSS isolation
  const shadowRoot = host.attachShadow({ mode: 'open' });

  // Inject content stylesheet into Shadow DOM
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content.css');
    shadowRoot.appendChild(link);
  } else {
    // In standalone or test harness mode
    const fallbackLink = document.createElement('link');
    fallbackLink.rel = 'stylesheet';
    fallbackLink.href = 'content.css';
    shadowRoot.appendChild(fallbackLink);
  }

  // Mount point for React
  const appContainer = document.createElement('div');
  appContainer.id = 'hyperlink-app-root';
  appContainer.style.fontSize = '14px';
  shadowRoot.appendChild(appContainer);

  const root = createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <HyperlinkProvider>
        <OverlayApp />
      </HyperlinkProvider>
    </React.StrictMode>
  );

  // Safely insert into document
  if (document.body) {
    document.body.appendChild(host);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(host);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHyperlink);
} else {
  initHyperlink();
}
