import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { AIProviderType } from '../../types';
import { sanitizeGroqModel } from '../../services/ai/aiModels';
import { 
  Settings, 
  Key, 
  Search, 
  ShieldCheck, 
  Sliders, 
  Eye, 
  EyeOff, 
  Save, 
  RotateCcw, 
  Check, 
  CheckCircle2,
  Cpu, 
  Sparkles,
  Command,
  Layout,
  X,
  Palette,
  Sun,
  Moon,
  ExternalLink
} from 'lucide-react';

interface SettingsPanelProps {
  standalone?: boolean;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ standalone = false }) => {
  const { settings, updateSettings, addToast, openFeatureWithProps, isLightMode = false } = useHyperlink();

  const [provider, setProvider] = useState<AIProviderType>(settings.aiConfig.provider);
  const [apiKey, setApiKey] = useState(settings.aiConfig.apiKey || '');
  const [modelName, setModelName] = useState(
    settings.aiConfig.provider === 'groq'
      ? sanitizeGroqModel(settings.aiConfig.modelName)
      : (settings.aiConfig.modelName || 'gemini-1.5-flash')
  );
  const [customEndpoint, setCustomEndpoint] = useState(settings.aiConfig.customEndpoint || '');
  const [searchEngine, setSearchEngine] = useState(settings.defaultSearchEngine);
  const [sidebarPosition, setSidebarPosition] = useState(settings.sidebarPosition);
  const [enableFloatingTrigger, setEnableFloatingTrigger] = useState(settings.enableFloatingTrigger);
  const [enableSelectionToolbar, setEnableSelectionToolbar] = useState(settings.enableSelectionToolbar);
  const [privacyMode, setPrivacyMode] = useState(settings.privacyMode);
  
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [saveAck, setSaveAck] = useState<{
    show: boolean;
    provider: string;
    model: string;
    time: string;
    hasKey: boolean;
  } | null>(null);

  // Synchronize local form inputs when settings are loaded from storage
  useEffect(() => {
    if (settings && settings.aiConfig) {
      setProvider(settings.aiConfig.provider);
      setApiKey(settings.aiConfig.apiKey || '');
      const sanitizedModel = settings.aiConfig.provider === 'groq'
        ? sanitizeGroqModel(settings.aiConfig.modelName)
        : (settings.aiConfig.modelName || 'gemini-1.5-flash');
      setModelName(sanitizedModel);
      setCustomEndpoint(settings.aiConfig.customEndpoint || '');
      setSearchEngine(settings.defaultSearchEngine);
      setSidebarPosition(settings.sidebarPosition);
      setEnableFloatingTrigger(settings.enableFloatingTrigger);
      setEnableSelectionToolbar(settings.enableSelectionToolbar);
      setPrivacyMode(settings.privacyMode);
    }
  }, [settings]);

  // Compute if there are unsaved changes
  const isDirty = 
    provider !== settings.aiConfig.provider ||
    apiKey.trim() !== (settings.aiConfig.apiKey || '').trim() ||
    modelName.trim() !== (settings.aiConfig.modelName || '').trim() ||
    customEndpoint.trim() !== (settings.aiConfig.customEndpoint || '').trim() ||
    searchEngine !== settings.defaultSearchEngine ||
    sidebarPosition !== settings.sidebarPosition ||
    enableFloatingTrigger !== settings.enableFloatingTrigger ||
    enableSelectionToolbar !== settings.enableSelectionToolbar ||
    privacyMode !== settings.privacyMode;

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      let finalModel = modelName.trim();
      if (provider === 'groq') {
        finalModel = sanitizeGroqModel(finalModel);
        setModelName(finalModel);
      }

      await updateSettings({
        aiConfig: {
          provider,
          apiKey: apiKey.trim(),
          modelName: finalModel,
          customEndpoint: customEndpoint.trim() || undefined,
        },
        defaultSearchEngine: searchEngine,
        sidebarPosition,
        enableFloatingTrigger,
        enableSelectionToolbar,
        privacyMode,
        theme: 'dark',
      });

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setJustSaved(true);
      setSaveAck({
        show: true,
        provider,
        model: finalModel,
        time: timeStr,
        hasKey: !!apiKey.trim(),
      });

      addToast(
        'Settings Saved Successfully',
        'success',
        `Active: ${provider.toUpperCase()} (${finalModel}) • Applied immediately`
      );

      // Revert justSaved button label after 3.5 seconds
      setTimeout(() => {
        setJustSaved(false);
      }, 3500);

      // Auto-dismiss popup acknowledgement banner after 8 seconds
      setTimeout(() => {
        setSaveAck(prev => prev ? { ...prev, show: false } : null);
      }, 8000);
    } catch (err: any) {
      addToast('Failed to save settings', 'error', err?.message || 'Storage write failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset all settings to default values?')) {
      await updateSettings({
        aiConfig: {
          provider: 'builtin_mock',
          modelName: 'gemini-1.5-flash',
          apiKey: '',
        },
        defaultSearchEngine: 'google',
        sidebarPosition: 'left',
        enableFloatingTrigger: true,
        enableSelectionToolbar: true,
        privacyMode: true,
        theme: 'dark',
      });
      setProvider('builtin_mock');
      setApiKey('');
      setModelName('gemini-1.5-flash');
      setSearchEngine('google');
      setSidebarPosition('left');
      setEnableFloatingTrigger(true);
      setEnableSelectionToolbar(true);
      setPrivacyMode(true);
      setSaveAck({
        show: true,
        provider: 'builtin_mock',
        model: 'gemini-1.5-flash',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        hasKey: false,
      });
      addToast('Settings reset to defaults', 'info');
    }
  };

  const panelContent = (
    <div className={`flex flex-col h-full select-text transition-colors duration-200 ${
      isLightMode ? 'text-slate-900' : 'text-slate-100'
    }`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {/* Dynamic Save Popup Acknowledgement Banner */}
        {saveAck && saveAck.show && (
          <div className={`relative p-4 rounded-2xl border shadow-lg flex items-start gap-3.5 animate-hyperlink-fade transition-all ${
            isLightMode
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
              : 'bg-emerald-950/70 border-emerald-500/60 shadow-[0_10px_30px_rgba(16,185,129,0.25)] text-slate-100'
          }`}>
            <div className={`p-2 rounded-xl border shrink-0 shadow-inner ${
              isLightMode
                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <h4 className={`text-sm font-bold tracking-wide ${isLightMode ? 'text-emerald-950' : 'text-white'}`}>
                  Settings Saved & Synchronized
                </h4>
                <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
                  isLightMode
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  ACTIVE
                </span>
              </div>
              <p className={`text-xs mt-1 leading-relaxed ${isLightMode ? 'text-emerald-900' : 'text-emerald-200/90'}`}>
                Engine configurations have been applied and persisted into Chrome extension storage. All Hyperlink sidebars, AI features, and command bars will immediately use these parameters.
              </p>
              
              <div className={`flex flex-wrap items-center gap-2 mt-3 pt-2.5 border-t text-[11px] font-mono ${
                isLightMode ? 'border-emerald-200 text-emerald-900' : 'border-emerald-500/20 text-emerald-200'
              }`}>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isLightMode ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-emerald-900/50 border-emerald-500/30 text-emerald-200'
                }`}>
                  Engine: <strong className={isLightMode ? 'text-emerald-950 font-bold' : 'text-white'}>{saveAck.provider.toUpperCase()}</strong>
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isLightMode ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-emerald-900/50 border-emerald-500/30 text-emerald-200'
                }`}>
                  Model: <strong className={isLightMode ? 'text-emerald-950 font-bold' : 'text-white'}>{saveAck.model}</strong>
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isLightMode ? 'bg-white border-emerald-200 text-emerald-900' : 'bg-emerald-900/50 border-emerald-500/30 text-emerald-200'
                }`}>
                  API Key: <strong className={isLightMode ? 'text-emerald-950 font-bold' : 'text-white'}>{saveAck.hasKey ? 'Configured & Secured' : 'None / Built-in'}</strong>
                </span>
                <span className={`px-2.5 py-1 rounded-lg border ${
                  isLightMode ? 'bg-white border-emerald-200 text-slate-700' : 'bg-emerald-900/50 border-emerald-500/30 text-slate-300'
                }`}>
                  Saved at: <strong>{saveAck.time}</strong>
                </span>
              </div>
            </div>

            <button
              onClick={() => setSaveAck(prev => prev ? { ...prev, show: false } : null)}
              className={`absolute top-3 right-3 p-1.5 rounded-lg transition-colors ${
                isLightMode ? 'text-emerald-700 hover:bg-emerald-100' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title="Dismiss confirmation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 1. Appearance & UI Style */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-indigo-400">
            <Palette className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Appearance & Style</h3>
          </div>

          <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-3">
            <div>
              <div className="text-xs font-semibold text-slate-100 flex items-center justify-between">
                <span>UI Theme (Single Mode)</span>
                <span className="px-2 py-0.5 text-[9px] font-mono font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Dark Glass Active
                </span>
              </div>
              <p className="text-[11px] mt-1 leading-relaxed text-zinc-400">
                The Hyperlink command center operates in permanent Dark Obsidian Glass with high-contrast white typography. To change the visual appearance of websites, use the Page Theme Studio.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-white/[0.08] bg-white/[0.03] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dark Obsidian Glass</div>
                  <div className="text-[10px] text-zinc-400">Smoked obsidian glass with luminous jewel accents and white text</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => openFeatureWithProps('theme')}
                className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 hover:underline cursor-pointer"
              >
                Page Themes →
              </button>
            </div>
          </div>
        </section>

        {/* 2. AI Model Configuration */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${isLightMode ? 'text-indigo-700' : 'text-indigo-400'}`}>
              <Cpu className="w-4 h-4" />
              <h3 className="text-xs font-semibold uppercase tracking-wider">AI Provider & Intelligence</h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% FREE APP
            </span>
          </div>

          {/* 100% Free App Appeal & Quick Groq Setup Guide */}
          <div className="p-4 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-[#070a14] space-y-3 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <h4 className="text-xs font-bold text-white tracking-wide">
                    Whole App is 100% Free • Why Add an API Key?
                  </h4>
                </div>
                <p className="text-[11.5px] text-zinc-300 leading-relaxed">
                  Hyperlink is <strong>completely free with zero subscriptions or hidden fees</strong>. Cloud AI models run on high-performance GPUs. By connecting your own free API key (like Groq or Gemini), you get <strong>direct, unlimited, high-speed intelligence</strong> without rate limits or queue delays.
                </p>
              </div>
            </div>

            {/* Step-by-Step Groq Guide */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>⚡ Quick 1-Minute Groq Setup (Recommended — 100% Free Forever)</span>
                </span>
                <span className="text-[9px] font-mono text-zinc-400">No Credit Card Needed</span>
              </div>

              <div className="grid grid-cols-1 gap-2 text-[11px] text-zinc-300">
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Sign up in 10 seconds:</strong> Open <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium">console.groq.com</a> (1-click login with Google or GitHub).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Copy Free Key:</strong> Click <strong>API Keys</strong> in the left sidebar → click <strong>Create API Key</strong> → copy the key (<code className="text-indigo-300 bg-white/5 px-1 rounded">gsk_...</code>).</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full bg-indigo-500/30 text-indigo-300 font-bold text-[9px] flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Paste & Save:</strong> Select <strong>Groq Cloud</strong> below, paste your key, and click <strong>Save Settings</strong>!</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => window.open('https://console.groq.com/keys', '_blank')}
                  className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
                >
                  <ExternalLink size={11} />
                  <span>Get Free Groq Key (console.groq.com) ↗</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProvider('groq');
                    setModelName('llama-3.1-8b-instant');
                  }}
                  className="py-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-[11px] transition-colors cursor-pointer border border-white/10"
                >
                  Select Groq Cloud Below
                </button>
                <span className="text-[10px] text-zinc-400">
                  Tip: Google Gemini keys are also free at <a href="https://aistudio.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">aistudio.google.com</a>
                </span>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
            isLightMode ? 'bg-black/[0.03] border-black/[0.08]' : 'bg-white/5 border-white/10'
          }`}>
            <div>
              <label className={`text-xs block mb-1 font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>
                Provider Engine
              </label>
              <select
                value={provider}
                onChange={(e) => {
                  const p = e.target.value as AIProviderType;
                  setProvider(p);
                  if (p === 'gemini') setModelName('gemini-1.5-flash');
                  else if (p === 'openai') setModelName('gpt-4o-mini');
                  else if (p === 'groq') setModelName('llama-3.1-8b-instant');
                  else if (p === 'ollama') setModelName('llama3');
                }}
                className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                  isLightMode
                    ? 'bg-white border border-black/[0.12] text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500/20'
                    : 'bg-[#070a14]/90 border border-white/[0.08] text-white focus:border-indigo-400/50'
                }`}
              >
                <option value="builtin_mock">Built-in Hybrid Engine (Free / No Key Required)</option>
                <option value="groq">Groq Cloud (Qwen 3.8 27B, Llama 3.1 8B, DeepSeek R1 - Free)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Flash / Pro)</option>
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="ollama">Ollama (Local Private LLM)</option>
              </select>
            </div>

            {provider !== 'builtin_mock' && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>
                      API Key
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className={`text-[11px] flex items-center gap-1 cursor-pointer ${
                        isLightMode ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {showApiKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showApiKey ? 'Hide' : 'Show'}</span>
                    </button>
                  </div>
                  <div className="relative">
                    <Key className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                      isLightMode ? 'text-slate-400' : 'text-slate-500'
                    }`} />
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      placeholder={provider === 'gemini' ? 'AIzaSy...' : provider === 'groq' ? 'gsk_...' : 'sk-...'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none transition-colors ${
                        isLightMode
                          ? 'bg-white border border-black/[0.12] text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                          : 'bg-[#070a14]/90 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-400'
                      }`}
                    />
                  </div>
                  <p className={`text-[10px] mt-1 ${isLightMode ? 'text-slate-500' : 'text-zinc-500'}`}>
                    Your key is stored securely in local extension sync storage and proxied safely through the extension service worker.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>
                      Model Name
                    </label>
                    <div className="flex items-center gap-1 flex-wrap">
                      {provider === 'groq' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModelName('qwen/qwen3.8-27b')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'qwen/qwen3.8-27b'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300 font-bold' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50 font-bold'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600 hover:text-slate-900' : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Groq Model: qwen/qwen3.8-27b"
                          >
                            qwen/qwen3.8-27b
                          </button>
                          <button
                            type="button"
                            onClick={() => setModelName('llama-3.1-8b-instant')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'llama-3.1-8b-instant'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600 hover:text-slate-900' : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Groq Ultra-Fast: Llama 3.1 8B Instant (Free for all keys)"
                          >
                            8B Instant
                          </button>
                          <button
                            type="button"
                            onClick={() => setModelName('deepseek-r1-distill-llama-70b')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'deepseek-r1-distill-llama-70b'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600 hover:text-slate-900' : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                            title="Groq Reasoning Flagship: DeepSeek R1 Distill 70B"
                          >
                            DeepSeek R1
                          </button>
                        </>
                      )}
                      {provider === 'gemini' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModelName('gemini-1.5-flash')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'gemini-1.5-flash'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            Flash
                          </button>
                          <button
                            type="button"
                            onClick={() => setModelName('gemini-1.5-pro')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'gemini-1.5-pro'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            Pro
                          </button>
                        </>
                      )}
                      {provider === 'openai' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setModelName('gpt-4o-mini')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'gpt-4o-mini'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            4o-mini
                          </button>
                          <button
                            type="button"
                            onClick={() => setModelName('gpt-4o')}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-colors cursor-pointer ${
                              modelName === 'gpt-4o'
                                ? isLightMode ? 'bg-indigo-100 text-indigo-800 border border-indigo-300' : 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/50'
                                : isLightMode ? 'bg-black/[0.05] text-slate-600' : 'bg-white/5 text-slate-400'
                            }`}
                          >
                            4o
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {provider === 'groq' && (
                    <div className="grid grid-cols-2 gap-1.5 mb-2">
                      <button
                        type="button"
                        onClick={() => setModelName('qwen/qwen3.8-27b')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          modelName === 'qwen/qwen3.8-27b'
                            ? isLightMode
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-1 ring-indigo-400/40'
                              : 'bg-indigo-500/20 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400/40'
                            : isLightMode
                              ? 'bg-black/[0.03] border-black/[0.08] text-slate-700 hover:bg-black/[0.06]'
                              : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">Qwen 3.8 27B</span>
                          <span className={`text-[9px] font-semibold px-1 rounded ${
                            modelName === 'qwen/qwen3.8-27b'
                              ? 'bg-indigo-500/30 text-indigo-300 font-bold'
                              : 'bg-indigo-500/10 text-indigo-400'
                          }`}>
                            {modelName === 'qwen/qwen3.8-27b' ? 'Active' : 'Select'}
                          </span>
                        </div>
                        <div className="text-[9.5px] font-mono text-indigo-400 font-semibold truncate mt-0.5">
                          qwen/qwen3.8-27b
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModelName('llama-3.1-8b-instant')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          modelName === 'llama-3.1-8b-instant'
                            ? isLightMode
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-1 ring-indigo-400/40'
                              : 'bg-indigo-500/20 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400/40'
                            : isLightMode
                              ? 'bg-black/[0.03] border-black/[0.08] text-slate-700 hover:bg-black/[0.06]'
                              : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">Llama 3.1 8B</span>
                          <span className="text-[9px] font-semibold px-1 rounded bg-emerald-500/20 text-emerald-400">
                            {modelName === 'llama-3.1-8b-instant' ? 'Active' : 'Free'}
                          </span>
                        </div>
                        <div className="text-[9.5px] font-mono text-emerald-400 font-semibold truncate mt-0.5">
                          llama-3.1-8b-instant
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModelName('deepseek-r1-distill-llama-70b')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          modelName === 'deepseek-r1-distill-llama-70b'
                            ? isLightMode
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-1 ring-indigo-400/40'
                              : 'bg-indigo-500/20 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400/40'
                            : isLightMode
                              ? 'bg-black/[0.03] border-black/[0.08] text-slate-700 hover:bg-black/[0.06]'
                              : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">DeepSeek R1 70B</span>
                          <span className="text-[9px] font-semibold px-1 rounded bg-amber-500/20 text-amber-300">
                            {modelName === 'deepseek-r1-distill-llama-70b' ? 'Active' : 'Reason'}
                          </span>
                        </div>
                        <div className="text-[9.5px] font-mono text-amber-400 font-semibold truncate mt-0.5">
                          deepseek-r1-distill...
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModelName('llama-3.3-70b-versatile')}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                          modelName === 'llama-3.3-70b-versatile'
                            ? isLightMode
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm ring-1 ring-indigo-400/40'
                              : 'bg-indigo-500/20 border-indigo-400 text-white shadow-sm ring-1 ring-indigo-400/40'
                            : isLightMode
                              ? 'bg-black/[0.03] border-black/[0.08] text-slate-700 hover:bg-black/[0.06]'
                              : 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold">Llama 3.3 70B</span>
                          <span className="text-[9px] font-semibold px-1 rounded bg-purple-500/20 text-purple-300">
                            {modelName === 'llama-3.3-70b-versatile' ? 'Active' : 'Versatile'}
                          </span>
                        </div>
                        <div className="text-[9.5px] font-mono text-purple-400 font-semibold truncate mt-0.5">
                          llama-3.3-70b-versatile
                        </div>
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    list={provider === 'groq' ? 'groq-models-datalist' : undefined}
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder={provider === 'groq' ? 'qwen/qwen3.8-27b' : provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                      isLightMode
                        ? 'bg-white border border-black/[0.12] text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                        : 'bg-[#070a14]/90 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-400'
                    }`}
                  />
                  {provider === 'groq' && (
                    <datalist id="groq-models-datalist">
                      <option value="qwen/qwen3.8-27b">Qwen 3.8 27B</option>
                      <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                      <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill 70B</option>
                      <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                    </datalist>
                  )}
                </div>

                {provider === 'ollama' && (
                  <div>
                    <label className={`text-xs block mb-1 font-semibold ${isLightMode ? 'text-slate-800' : 'text-slate-300'}`}>
                      Ollama Host URL
                    </label>
                    <input
                      type="text"
                      value={customEndpoint}
                      onChange={(e) => setCustomEndpoint(e.target.value)}
                      placeholder="http://localhost:11434"
                      className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                        isLightMode
                          ? 'bg-white border border-black/[0.12] text-slate-900 placeholder-slate-400 focus:border-indigo-600'
                          : 'bg-[#070a14]/90 border border-white/10 text-white placeholder-slate-500 focus:border-indigo-400'
                      }`}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* 3. Search Engine Provider */}
        <section className="space-y-3">
          <div className={`flex items-center gap-2 ${isLightMode ? 'text-indigo-700' : 'text-indigo-400'}`}>
            <Search className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Search Engine Provider</h3>
          </div>

          <div className={`p-4 rounded-xl border transition-colors ${
            isLightMode ? 'bg-black/[0.03] border-black/[0.08]' : 'bg-white/5 border-white/10'
          }`}>
            <select
              value={searchEngine}
              onChange={(e) => setSearchEngine(e.target.value as any)}
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                isLightMode
                  ? 'bg-white border border-black/[0.12] text-slate-900 focus:border-indigo-600'
                  : 'bg-[#070a14]/90 border border-white/10 text-slate-200 focus:border-indigo-400'
              }`}
            >
              <option value="google">Google Search</option>
              <option value="duckduckgo">DuckDuckGo (Privacy Focused)</option>
              <option value="perplexity">Perplexity AI (Direct Answers)</option>
              <option value="brave">Brave Search</option>
              <option value="bing">Microsoft Bing</option>
              <option value="kagi">Kagi Search</option>
            </select>
          </div>
        </section>

        {/* 4. Interface Preferences */}
        <section className="space-y-3">
          <div className={`flex items-center gap-2 ${isLightMode ? 'text-indigo-700' : 'text-indigo-400'}`}>
            <Layout className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Interface & Behavior</h3>
          </div>

          <div className={`p-4 rounded-xl border space-y-3.5 transition-colors ${
            isLightMode ? 'bg-black/[0.03] border-black/[0.08]' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <div className={`text-xs font-semibold ${isLightMode ? 'text-slate-900' : 'text-slate-200'}`}>
                  Sidebar Position
                </div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Choose dock side of the browser window
                </div>
              </div>
              <div className={`flex rounded-xl p-0.5 border ${
                isLightMode ? 'bg-black/[0.05] border-black/[0.08]' : 'bg-black/40 border-white/10'
              }`}>
                <button
                  type="button"
                  onClick={() => setSidebarPosition('left')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sidebarPosition === 'left'
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : isLightMode ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Left
                </button>
                <button
                  type="button"
                  onClick={() => setSidebarPosition('right')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    sidebarPosition === 'right'
                      ? 'bg-indigo-600 text-white font-bold shadow-sm'
                      : isLightMode ? 'text-slate-600 hover:text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Right
                </button>
              </div>
            </div>

            <div className={`flex items-center justify-between pt-2.5 border-t ${
              isLightMode ? 'border-black/[0.06]' : 'border-white/5'
            }`}>
              <div>
                <div className={`text-xs font-semibold ${isLightMode ? 'text-slate-900' : 'text-slate-200'}`}>
                  Floating Margin Trigger
                </div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Show subtle lightning trigger pill on hover when closed
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableFloatingTrigger}
                onChange={(e) => setEnableFloatingTrigger(e.target.checked)}
                className="rounded accent-indigo-600 cursor-pointer w-4 h-4"
              />
            </div>

            <div className={`flex items-center justify-between pt-2.5 border-t ${
              isLightMode ? 'border-black/[0.06]' : 'border-white/5'
            }`}>
              <div>
                <div className={`text-xs font-semibold ${isLightMode ? 'text-slate-900' : 'text-slate-200'}`}>
                  Text Selection Quick Toolbar
                </div>
                <div className={`text-[10px] ${isLightMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Display instant AI, define, explain & translate pills on highlighted text
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSelectionToolbar}
                onChange={(e) => setEnableSelectionToolbar(e.target.checked)}
                className="rounded accent-indigo-600 cursor-pointer w-4 h-4"
              />
            </div>
          </div>
        </section>

        {/* 5. Global Keyboard Shortcuts */}
        <section className="space-y-3">
          <div className={`flex items-center gap-2 ${isLightMode ? 'text-indigo-700' : 'text-indigo-400'}`}>
            <Command className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Keyboard Shortcuts</h3>
          </div>

          <div className={`p-4 rounded-xl border space-y-2.5 transition-colors ${
            isLightMode ? 'bg-black/[0.03] border-black/[0.08]' : 'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className={isLightMode ? 'text-slate-800 font-medium' : 'text-slate-300'}>
                Toggle Hyperlink Sidebar
              </span>
              <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                isLightMode ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-white/10 border border-white/20 text-indigo-300'
              }`}>
                Ctrl/Cmd + Space
              </kbd>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isLightMode ? 'text-slate-800 font-medium' : 'text-slate-300'}>
                Alternative Quick Toggle
              </span>
              <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold ${
                isLightMode ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' : 'bg-white/10 border border-white/20 text-indigo-300'
              }`}>
                Alt + Space
              </kbd>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={isLightMode ? 'text-slate-800 font-medium' : 'text-slate-300'}>
                Close Panel or Overlay
              </span>
              <kbd className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                isLightMode ? 'bg-black/[0.05] border border-black/[0.08] text-slate-600' : 'bg-white/10 border border-white/20 text-slate-400'
              }`}>
                Escape
              </kbd>
            </div>
          </div>
        </section>

        {/* 6. Privacy & Guarantee */}
        <section className="space-y-3">
          <div className={`flex items-center gap-2 ${isLightMode ? 'text-emerald-700' : 'text-emerald-400'}`}>
            <ShieldCheck className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Zero-Telemetry Client Privacy</h3>
          </div>

          <div className={`p-4 rounded-xl border text-xs space-y-2 leading-relaxed ${
            isLightMode ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950' : 'bg-emerald-950/20 border border-emerald-500/30 text-slate-300'
          }`}>
            <p>
              Hyperlink executes strictly inside your browser sandbox and communicates with AI models directly from your client machine. No tracking servers, telemetry, or query recording.
            </p>
          </div>
        </section>
      </div>

      {/* Footer Action Bar */}
      <div className={`p-4 border-t flex items-center justify-between backdrop-blur-md transition-colors ${
        isLightMode ? 'bg-white/80 border-black/[0.08]' : 'bg-[#0b0f19]/80 border-white/10'
      }`}>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleResetDefaults}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
              isLightMode
                ? 'bg-black/[0.04] hover:bg-black/[0.08] text-slate-600 hover:text-slate-900'
                : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          {isDirty && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[11px] font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Unsaved changes
            </span>
          )}

          {justSaved && !isDirty && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 text-[11px] font-semibold animate-hyperlink-fade">
              <Check className="w-3.5 h-3.5" />
              Synchronized
            </span>
          )}
        </div>

        <button
          onClick={handleSaveAll}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-all duration-200 cursor-pointer ${
            justSaved
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
              : isDirty
              ? 'bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white shadow-indigo-500/30 scale-[1.02]'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'
          } disabled:opacity-50`}
        >
          {isSaving ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : justSaved ? (
            <>
              <Check className="w-4 h-4 text-white stroke-[3]" />
              <span>Settings Saved!</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>{isDirty ? 'Save Changes' : 'Save Settings'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  if (standalone) {
    return panelContent;
  }

  return (
    <PanelContainer
      title="System Settings"
      iconName="Settings"
      subtitle="Engine & Preferences"
      width="w-[500px]"
      headerActions={
        <button
          onClick={() => {
            if (typeof chrome !== 'undefined' && chrome.runtime?.openOptionsPage) {
              chrome.runtime.openOptionsPage();
            } else {
              window.open('options.html', '_blank');
            }
          }}
          title="Open Settings in Full Tab"
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-white hover:bg-white/[0.08]"
        >
          <ExternalLink size={13} />
        </button>
      }
    >
      {panelContent}
    </PanelContainer>
  );
};
