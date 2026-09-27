// Hyperlink Background Service Worker (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
  // Setup Context Menus
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'hyperlink-ask-ai',
      title: 'Ask Hyperlink AI about "%s"',
      contexts: ['selection'],
    });

    chrome.contextMenus.create({
      id: 'hyperlink-summarize-page',
      title: 'Summarize Page with Hyperlink',
      contexts: ['page'],
    });

    chrome.contextMenus.create({
      id: 'hyperlink-screenshot',
      title: 'Capture Screenshot with Hyperlink',
      contexts: ['page'],
    });
  });
});

// Helper to send message to active tab with auto-injection fallback
async function sendMessageToActiveTab(message: any) {
  try {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab || !activeTab.id || !activeTab.url) return;

    // Disallow chrome internal URLs
    if (activeTab.url.startsWith('chrome://') || activeTab.url.startsWith('chrome-extension://')) {
      return;
    }

    try {
      await chrome.tabs.sendMessage(activeTab.id, message);
    } catch {
      // If content script was not already injected (e.g. tab opened before extension load)
      await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ['content.js'],
      });
      // Retry sending message
      setTimeout(async () => {
        try {
          if (activeTab.id) {
            await chrome.tabs.sendMessage(activeTab.id, message);
          }
        } catch (err) {
          console.warn('Could not communicate with tab after injection:', err);
        }
      }, 150);
    }
  } catch (err) {
    console.error('Error sending message to active tab:', err);
  }
}

// Action button click (extension icon)
chrome.action.onClicked.addListener(async () => {
  await sendMessageToActiveTab({ type: 'TOGGLE_HYPERLINK' });
});

// Shortcut command listener (Ctrl+Space or custom)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-hyperlink') {
    await sendMessageToActiveTab({ type: 'TOGGLE_HYPERLINK' });
  }
});

// Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;

  if (info.menuItemId === 'hyperlink-ask-ai') {
    await sendMessageToActiveTab({
      type: 'OPEN_FEATURE',
      feature: 'ai',
      props: { initialPrompt: `Explain this text: "${info.selectionText}"` }
    });
  } else if (info.menuItemId === 'hyperlink-summarize-page') {
    await sendMessageToActiveTab({
      type: 'OPEN_FEATURE',
      feature: 'summarize'
    });
  } else if (info.menuItemId === 'hyperlink-screenshot') {
    await sendMessageToActiveTab({
      type: 'OPEN_FEATURE',
      feature: 'screenshot',
      props: { autoCapture: true }
    });
  }
});

// Message listener from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CAPTURE_TAB' || message.action === 'CAPTURE_TAB') {
    const windowId = sender.tab?.windowId;
    const captureOptions = { format: 'png' as const };

    const handleCallback = (dataUrl?: string) => {
      const err = chrome.runtime.lastError;
      if (err || !dataUrl) {
        console.warn('[Hyperlink SW] Primary captureVisibleTab failed:', err?.message);
        try {
          // Retry without specifying windowId
          chrome.tabs.captureVisibleTab(captureOptions, (fallbackUrl) => {
            if (chrome.runtime.lastError || !fallbackUrl) {
              const finalErr = chrome.runtime.lastError?.message || err?.message || 'Capture failed';
              console.error('[Hyperlink SW] Fallback captureVisibleTab failed:', finalErr);
              sendResponse({ success: false, error: finalErr });
            } else {
              sendResponse({ success: true, dataUrl: fallbackUrl });
            }
          });
        } catch (e: any) {
          sendResponse({ success: false, error: e.message || 'Capture failed' });
        }
      } else {
        sendResponse({ success: true, dataUrl });
      }
    };

    try {
      if (typeof windowId === 'number' && windowId >= 0) {
        chrome.tabs.captureVisibleTab(windowId, captureOptions, handleCallback);
      } else {
        chrome.tabs.captureVisibleTab(captureOptions, handleCallback);
      }
    } catch (e: any) {
      console.warn('[Hyperlink SW] Primary capture threw, retrying fallback:', e);
      try {
        chrome.tabs.captureVisibleTab(captureOptions, handleCallback);
      } catch (err2: any) {
        sendResponse({ success: false, error: err2.message || 'Capture failed' });
      }
    }
    return true; // Keep message channel open for async response
  }

  if (message.type === 'OPEN_OPTIONS') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'PROXY_FETCH') {
    const { url, options } = message;
    fetch(url, options)
      .then(async (response) => {
        let text = '';
        const contentType = response.headers.get('content-type') || '';
        const isHead = options && options.method && options.method.toUpperCase() === 'HEAD';
        if (!isHead && (contentType.includes('text') || contentType.includes('json') || contentType.includes('javascript') || contentType.includes('xml'))) {
          try {
            text = await response.text();
          } catch {
            text = '';
          }
        }
        sendResponse({
          success: true,
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          contentType: contentType,
          contentLength: response.headers.get('content-length'),
          text
        });
      })
      .catch((err) => {
        sendResponse({
          success: false,
          error: err.message || 'Network request failed'
        });
      });
    return true; // Keep message channel open for async response
  }

  if (message.type === 'DOWNLOAD_FILE') {
    const { url, filename, saveAs } = message;
    if (chrome.downloads) {
      chrome.downloads.download(
        {
          url,
          filename: filename || 'hyperlink-download',
          saveAs: saveAs ?? false,
        },
        (downloadId) => {
          if (chrome.runtime.lastError) {
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true, downloadId });
          }
        }
      );
      return true; // Keep message channel open for async response
    } else {
      sendResponse({ success: false, error: 'Downloads API not supported' });
      return false;
    }
  }

  // --- Tab Management Handlers ---
  if (message.type === 'TAB_GET_ALL') {
    if (chrome.tabs) {
      chrome.tabs.query({}, (tabs) => {
        if (chrome.runtime.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message, tabs: [] });
        } else {
          const tabList = (tabs || []).map((t) => ({
            id: t.id || 0,
            title: t.title || 'Untitled Tab',
            url: t.url || '',
            favIconUrl: t.favIconUrl || '',
            active: !!t.active,
            pinned: !!t.pinned,
            windowId: t.windowId,
            audible: !!t.audible,
            muted: !!t.mutedInfo?.muted
          }));
          sendResponse({ success: true, tabs: tabList });
        }
      });
      return true;
    } else {
      sendResponse({ success: false, error: 'Tabs API unavailable', tabs: [] });
      return false;
    }
  }

  if (message.type === 'TAB_SWITCH') {
    const { tabId, windowId } = message;
    if (chrome.tabs && typeof tabId === 'number') {
      chrome.tabs.update(tabId, { active: true }, () => {
        if (windowId && chrome.windows) {
          chrome.windows.update(windowId, { focused: true }, () => {});
        }
        sendResponse({ success: !chrome.runtime.lastError });
      });
      return true;
    }
    sendResponse({ success: false });
    return false;
  }

  if (message.type === 'TAB_CLOSE') {
    const { tabId } = message;
    if (chrome.tabs && typeof tabId === 'number') {
      chrome.tabs.remove(tabId, () => {
        sendResponse({ success: !chrome.runtime.lastError });
      });
      return true;
    }
    sendResponse({ success: false });
    return false;
  }

  if (message.type === 'TAB_CLOSE_MULTIPLE') {
    const { tabIds } = message;
    if (chrome.tabs && Array.isArray(tabIds) && tabIds.length > 0) {
      chrome.tabs.remove(tabIds, () => {
        sendResponse({ success: !chrome.runtime.lastError });
      });
      return true;
    }
    sendResponse({ success: false });
    return false;
  }

  if (message.type === 'TAB_CREATE') {
    const { url, active } = message;
    if (chrome.tabs && url) {
      chrome.tabs.create({ url, active: active ?? false }, (tab) => {
        sendResponse({ success: !chrome.runtime.lastError, tabId: tab?.id });
      });
      return true;
    }
    sendResponse({ success: false });
    return false;
  }

  if (message.type === 'TAB_TOGGLE_PIN') {
    const { tabId, pinned } = message;
    if (chrome.tabs && typeof tabId === 'number') {
      chrome.tabs.update(tabId, { pinned: !pinned }, () => {
        sendResponse({ success: !chrome.runtime.lastError });
      });
      return true;
    }
    sendResponse({ success: false });
    return false;
  }

  if (message.type === 'TAB_TOGGLE_MUTE') {
    const { tabId, muted } = message;
    if (chrome.tabs && typeof tabId === 'number') {
      chrome.tabs.update(tabId, { muted: !muted }, () => {
        sendResponse({ success: !chrome.runtime.lastError });
      });
      return true;
    }
    sendResponse({ success: false });
    return false;
  }

  return false;
});

