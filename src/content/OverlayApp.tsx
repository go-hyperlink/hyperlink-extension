import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../context/HyperlinkContext';
import { Sidebar } from '../components/sidebar/Sidebar';
import { ActiveFeatureRenderer } from '../components/panels/ActiveFeatureRenderer';
import { FloatingTrigger } from '../components/common/FloatingTrigger';
import { SelectionToolbar } from '../components/selection/SelectionToolbar';
import { ToastContainer } from '../components/common/Toast';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { SidebarFeatureId } from '../types';
import { recordingService } from '../services/capture/recordingService';

export const OverlayApp: React.FC = () => {
  const {
    isOpen,
    setIsOpen,
    toggleOpen,
    activeFeature,
    closeFeaturePanel,
    openFeatureWithProps,
    setCommandBarFocused,
    settings,
  } = useHyperlink();

  const [recordingStatus, setRecordingStatus] = useState<string>(recordingService.getStatus());

  useEffect(() => {
    return recordingService.subscribe((status) => {
      setRecordingStatus(status);
    });
  }, []);

  const isRecording = recordingStatus === 'recording' || recordingStatus === 'paused';

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Toggle with Ctrl+Space or Cmd+Space
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        toggleOpen();
        return;
      }

      // 2. Toggle with Alt+Space
      if (e.altKey && e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        toggleOpen();
        return;
      }

      // 3. Command Bar shortcut: Cmd+K / Ctrl+K
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        e.stopPropagation();
        if (!isOpen) {
          setIsOpen(true);
        }
        setCommandBarFocused(true);
        return;
      }

      // 4. Quick AI shortcut: Cmd+J / Ctrl+J
      if ((e.metaKey || e.ctrlKey) && (e.key === 'j' || e.key === 'J')) {
        e.preventDefault();
        e.stopPropagation();
        openFeatureWithProps('ai');
        return;
      }

      // 5. Escape handler: Close secondary panel first, then close sidebar
      if (e.key === 'Escape') {
        if (activeFeature) {
          e.preventDefault();
          e.stopPropagation();
          closeFeaturePanel();
        } else if (isOpen) {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, activeFeature, toggleOpen, setIsOpen, closeFeaturePanel, openFeatureWithProps, setCommandBarFocused]);

  // Click-Outside Dismiss: Clicking outside of Hyperlink UI closes sidebar & open panels
  useEffect(() => {
    if (!isOpen && !activeFeature) return;

    const handlePointerDownOutside = (e: MouseEvent | PointerEvent) => {
      if (isRecording || document.getElementById('hyperlink-screenshot-drag-overlay')) {
        return;
      }

      const host = document.getElementById('hyperlink-extension-overlay');
      const path = (e.composedPath && e.composedPath()) || [];
      if (host && (path.includes(host) || (e.target && host.contains(e.target as Node)))) {
        return;
      }

      const isInsideHyperlink = path.some((target: any) => {
        if (!target) return false;
        if (
          target.id === 'hyperlink-root-container' ||
          target.id === 'hyperlink-extension-overlay' ||
          target.id === 'hyperlink-app-root' ||
          target.id === 'hyperlink-floating-trigger' ||
          target.id === 'hyperlink-screenshot-drag-overlay'
        ) {
          return true;
        }
        if (typeof target.className === 'string' && target.className.includes('hyperlink-')) {
          return true;
        }
        if (target instanceof ShadowRoot || (target.nodeType === 11 && target.mode)) {
          return true;
        }
        return false;
      });

      if (!isInsideHyperlink) {
        setIsOpen(false);
        closeFeaturePanel();
      }
    };

    window.addEventListener('pointerdown', handlePointerDownOutside, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDownOutside, true);
    };
  }, [isOpen, activeFeature, isRecording, setIsOpen, closeFeaturePanel]);

  // Chrome Background / Context Menu Message Listener
  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.onMessage) {
      return;
    }

    const messageListener = (
      message: any,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.type === 'TOGGLE_HYPERLINK') {
        toggleOpen();
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'OPEN_FEATURE' && message.feature) {
        openFeatureWithProps(message.feature as SidebarFeatureId, message.props);
        sendResponse({ success: true });
        return true;
      }

      if (message.type === 'CAPTURE_VIEWPORT') {
        openFeatureWithProps('screenshot', { autoCapture: true });
        sendResponse({ success: true });
        return true;
      }

      return false;
    };

    chrome.runtime.onMessage.addListener(messageListener);
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, [toggleOpen, openFeatureWithProps]);

  return (
    <div
      id="hyperlink-root-container"
      data-theme="dark"
      className="font-sans antialiased text-white select-none"
    >
      {/* Floating Trigger Pill on page margin when sidebar closed and not recording */}
      {!isRecording && <FloatingTrigger />}

      {/* Floating Text Selection Toolbar */}
      {!isRecording && <SelectionToolbar />}

      {/* Main Glass Sidebar (Hidden completely during screen recording) */}
      {isOpen && !isRecording && (
        <ErrorBoundary fallbackTitle="Sidebar Notice">
          <Sidebar />
        </ErrorBoundary>
      )}

      {/* Active Secondary Tool Panel (Renders either beside sidebar or as floating pill during recording) */}
      {(isOpen || isRecording) && activeFeature && (
        <ErrorBoundary key={activeFeature} fallbackTitle="Panel Notice">
          <ActiveFeatureRenderer />
        </ErrorBoundary>
      )}

      {/* Global Notification Toast Container */}
      <ToastContainer />
    </div>
  );
};
