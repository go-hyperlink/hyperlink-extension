import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  Zap, 
  Sparkles, 
  Camera, 
  FileText, 
  Settings, 
  ExternalLink,
  FileDown,
  FileEdit,
  Film
} from 'lucide-react';
import { storageService, DEFAULT_SETTINGS } from '../services/storage/storageService';
import { UserSettings } from '../types';

const PopupApp: React.FC = () => {
  const [, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    storageService.getSettings().then(s => setSettings(s));
  }, []);

  const triggerOverlay = async (action: string = 'TOGGLE_HYPERLINK', feature?: string) => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!activeTab || !activeTab.id) return;

      if (action === 'TOGGLE_HYPERLINK') {
        await chrome.tabs.sendMessage(activeTab.id, { type: 'TOGGLE_HYPERLINK' });
      } else if (action === 'OPEN_FEATURE' && feature) {
        await chrome.tabs.sendMessage(activeTab.id, { type: 'OPEN_FEATURE', feature });
      }
      window.close();
    } catch {
      window.close();
    }
  };

  const openSettings = () => {
    chrome.runtime.openOptionsPage();
    window.close();
  };

  return (
    <div className="flex flex-col h-full p-4 select-none bg-[#0b0f19] text-zinc-100 border border-white/[0.12]">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          {/* Jewel Logo */}
          <div className="relative w-7 h-7 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 border border-white/20">
            <Zap className="w-3.5 h-3.5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs font-bold tracking-tight text-white">
                HYPERLINK
              </h1>
              <span className="bg-white/[0.06] border border-white/[0.08] text-zinc-400 px-1.5 py-[0.5px] text-[8px] font-mono font-semibold rounded">
                PRO
              </span>
            </div>
            <span className="text-[10px] font-mono leading-none text-zinc-400">
              Command Center
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={openSettings}
            className="p-1.5 rounded-lg transition-colors cursor-pointer text-zinc-400 hover:text-white hover:bg-white/10"
            title="Open Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Activation Banner */}
      <div className="py-3">
        <button
          onClick={() => triggerOverlay('TOGGLE_HYPERLINK')}
          className="w-full py-2.5 px-4 rounded-2xl font-bold text-xs flex items-center justify-between shadow-lg transition-all cursor-pointer bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-700 hover:from-indigo-400 hover:to-violet-600 text-white shadow-indigo-500/30"
        >
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 fill-white" />
            <span>Open Command Center</span>
          </div>
          <kbd className="text-[10px] px-2 py-0.5 rounded bg-black/25 text-white/90 font-mono">
            Ctrl+Space
          </kbd>
        </button>
      </div>

      {/* Quick Launch Panel Grid */}
      <div className="space-y-1.5 pt-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
          Quick Actions
        </span>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => triggerOverlay('OPEN_FEATURE', 'ai')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
          >
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-tight text-white">Ask AI</span>
              <span className="text-[10px] truncate text-zinc-400">Page intelligence</span>
            </div>
          </button>

          <button
            onClick={() => triggerOverlay('OPEN_FEATURE', 'summarize')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
          >
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-tight text-white">Summarize</span>
              <span className="text-[10px] truncate text-zinc-400">TL;DR briefing</span>
            </div>
          </button>

          <button
            onClick={() => triggerOverlay('OPEN_FEATURE', 'screenshot')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
          >
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-tight text-white">Screenshot</span>
              <span className="text-[10px] truncate text-zinc-400">Viewport & area</span>
            </div>
          </button>

          <button
            onClick={() => triggerOverlay('OPEN_FEATURE', 'pdf')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
          >
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <FileDown className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-tight text-white">Page → PDF</span>
              <span className="text-[10px] truncate text-zinc-400">Clean export</span>
            </div>
          </button>

          <button
            onClick={() => triggerOverlay('OPEN_FEATURE', 'notes')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
          >
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <FileEdit className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-tight text-white">Notes</span>
              <span className="text-[10px] truncate text-zinc-400">Markdown & clip</span>
            </div>
          </button>

          <button
            onClick={() => triggerOverlay('OPEN_FEATURE', 'media_downloader')}
            className="flex items-center gap-2.5 p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] text-zinc-200 hover:text-white border-white/[0.08]"
          >
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400">
              <Film className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col truncate">
              <span className="font-semibold leading-tight text-white">Downloader</span>
              <span className="text-[10px] truncate text-zinc-400">YT & web media</span>
            </div>
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]" />
          <span>Active on current tab</span>
        </span>
        <button
          onClick={openSettings}
          className="flex items-center gap-1 font-medium transition-colors cursor-pointer text-indigo-400 hover:text-white"
        >
          <span>Preferences</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<PopupApp />);
