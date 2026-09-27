import React from 'react';
import { createRoot } from 'react-dom/client';
import { HyperlinkProvider } from '../context/HyperlinkContext';
import { SettingsPanel } from '../features/settings/SettingsPanel';
import { ToastContainer } from '../components/common/Toast';
import { Zap } from 'lucide-react';

const OptionsContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#070a13] text-slate-100">
      <ToastContainer />

      {/* Top Navigation */}
      <header className="border-b sticky top-0 z-50 backdrop-blur-xl bg-[#0b0f19]/80 border-white/10">
        <div className="max-w-4xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Jewel Logo */}
            <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20">
              <Zap className="w-4 h-4 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-wider text-white">
                  HYPERLINK
                </h1>
                <span className="px-1.5 py-[0.5px] text-[9px] font-mono font-semibold rounded bg-white/[0.06] border border-white/[0.08] text-zinc-400">
                  PRO
                </span>
              </div>
              <span className="text-xs font-mono text-zinc-400">
                Universal Command Center
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full font-mono text-[11px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              v1.0.0
            </span>
          </div>
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6">
        <div className="backdrop-blur-2xl border rounded-2xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col bg-[#0b0f19]/80 border-white/10 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)]">
          <div className="p-6 border-b border-white/10 bg-white/[0.02]">
            <h2 className="text-lg font-bold text-white">
              System Settings & Engine Configuration
            </h2>
            <p className="text-xs mt-1 text-slate-400">
              Configure your AI intelligence models, search providers, UI appearance, and local security.
            </p>
          </div>

          <div className="flex-1">
            <SettingsPanel standalone={true} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4 text-center text-xs border-white/5 text-slate-500">
        Hyperlink — Translucent Native Layer for the Modern Web
      </footer>
    </div>
  );
};

const OptionsApp: React.FC = () => {
  return (
    <React.StrictMode>
      <HyperlinkProvider>
        <OptionsContent />
      </HyperlinkProvider>
    </React.StrictMode>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<OptionsApp />);
