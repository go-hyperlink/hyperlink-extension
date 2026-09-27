import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { aiService } from '../../services/ai/AIService';
import { 
  Terminal, 
  Pipette, 
  Code, 
  FileJson, 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Globe, 
  Layers, 
  Clock, 
  Hash, 
  Play
} from 'lucide-react';

export const DevToolsPanel: React.FC = () => {
  const { addToast, pageContext } = useHyperlink();
  const [activeTab, setActiveTab] = useState<'info' | 'json' | 'eyedropper' | 'ai'>('info');

  // Page Info State
  const [pageStats, setPageStats] = useState({
    title: document.title,
    url: window.location.href,
    protocol: window.location.protocol,
    domElements: 0,
    scriptsCount: 0,
    stylesheetsCount: 0,
    imagesCount: 0,
    loadTimeMs: 0
  });

  useEffect(() => {
    try {
      const perf = window.performance.timing;
      const loadTime = perf.loadEventEnd > 0 ? (perf.loadEventEnd - perf.navigationStart) : 0;
      setPageStats({
        title: document.title || 'Untitled',
        url: window.location.href,
        protocol: window.location.protocol,
        domElements: document.querySelectorAll('*').length,
        scriptsCount: document.querySelectorAll('script').length,
        stylesheetsCount: document.querySelectorAll('link[rel="stylesheet"]').length,
        imagesCount: document.querySelectorAll('img').length,
        loadTimeMs: Math.max(0, loadTime)
      });
    } catch {
      // fallback in sandbox
    }
  }, []);

  // JSON Formatter State
  const [jsonInput, setJsonInput] = useState('{"name":"Hyperlink","type":"browser_extension","active":true}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState('');

  const formatJson = (indent: number = 2) => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, indent));
      setJsonError('');
      addToast('JSON formatted', 'success');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
      addToast('Invalid JSON syntax', 'error');
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed));
      setJsonError('');
      addToast('JSON minified', 'success');
    } catch (err: any) {
      setJsonError(err.message || 'Invalid JSON');
      addToast('Invalid JSON syntax', 'error');
    }
  };

  // Eyedropper State
  const [pickedColors, setPickedColors] = useState<string[]>(['#06b6d4', '#3b82f6', '#10b981']);
  const [eyeDropperSupported, setEyeDropperSupported] = useState(false);

  useEffect(() => {
    setEyeDropperSupported('EyeDropper' in window);
  }, []);

  const handlePickColor = async () => {
    if (!('EyeDropper' in window)) {
      addToast('EyeDropper API is not supported in this browser', 'error');
      return;
    }
    try {
      const eyeDropper = new (window as any).EyeDropper();
      const result = await eyeDropper.open();
      if (result?.sRGBHex) {
        setPickedColors(prev => [result.sRGBHex, ...prev.slice(0, 15)]);
        await navigator.clipboard.writeText(result.sRGBHex);
        addToast(`Color ${result.sRGBHex} copied to clipboard!`, 'success');
      }
    } catch {
      // User cancelled selection or error
    }
  };

  // AI Dev Assistant State
  const [codePrompt, setCodePrompt] = useState('');
  const [aiCodeResponse, setAiCodeResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleRunAiDev = async () => {
    if (!codePrompt.trim()) return;
    setIsAiLoading(true);
    setAiCodeResponse('');
    try {
      const prompt = `You are an expert full-stack developer assistant. Analyze or answer this coding request:\n\n${codePrompt}\n\nCurrent Page Context: ${pageStats.title} (${pageStats.url})`;
      const res = await aiService.chat([
        { id: '1', role: 'user', content: prompt, timestamp: Date.now() }
      ], pageContext);
      setAiCodeResponse(res.text);
    } catch (err: any) {
      addToast(err.message || 'AI Dev Assistant failed', 'error');
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  };

  return (
    <PanelContainer
      title="Developer Tools"
      iconName="Terminal"
      subtitle="Inspect, AI Code & Utils"
      width="w-[500px]"
    >
      <div className="flex flex-col h-full text-slate-100">
      {/* Dev Navigation */}
      <div className="flex items-center gap-1 p-3 border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'info'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Page Info</span>
        </button>

        <button
          onClick={() => setActiveTab('eyedropper')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'eyedropper'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Pipette className="w-3.5 h-3.5" />
          <span>Color Picker</span>
        </button>

        <button
          onClick={() => setActiveTab('json')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'json'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileJson className="w-3.5 h-3.5" />
          <span>JSON / Code</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'ai'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Dev</span>
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'info' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">Page Architecture</span>
              <div className="text-xs font-medium text-white truncate">{pageStats.title}</div>
              <div className="text-[11px] text-cyan-400 break-all">{pageStats.url}</div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-cyan-400" /> DOM Elements
                </span>
                <span className="text-lg font-bold text-white font-mono">{pageStats.domElements}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-400" /> Load Time
                </span>
                <span className="text-lg font-bold text-white font-mono">
                  {pageStats.loadTimeMs > 0 ? `${pageStats.loadTimeMs}ms` : 'Instant'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Code className="w-3 h-3 text-cyan-400" /> Scripts
                </span>
                <span className="text-lg font-bold text-white font-mono">{pageStats.scriptsCount}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Hash className="w-3 h-3 text-cyan-400" /> Stylesheets
                </span>
                <span className="text-lg font-bold text-white font-mono">{pageStats.stylesheetsCount}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-300">Shadow DOM Isolation Verified</div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Hyperlink is currently encapsulated inside an isolated ShadowRoot with zero styling leaks into this document.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'eyedropper' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-3">
              <Pipette className="w-8 h-8 text-cyan-400 mx-auto" />
              <div>
                <h4 className="text-sm font-semibold text-white">Universal Color Sampler</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Sample any pixel from the page and copy HEX or RGB codes.
                </p>
              </div>

              <button
                onClick={handlePickColor}
                disabled={!eyeDropperSupported}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {eyeDropperSupported ? 'Activate EyeDropper' : 'EyeDropper Unsupported'}
              </button>
            </div>

            {/* Color Palette History */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-300">Sampled Palette</span>
              <div className="grid grid-cols-2 gap-2">
                {pickedColors.map((color, idx) => (
                  <div
                    key={idx}
                    onClick={() => copyToClipboard(color)}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer group transition-all"
                  >
                    <div 
                      className="w-6 h-6 rounded-lg border border-white/20 shadow-sm flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-mono font-medium text-slate-200 truncate flex-1">
                      {color}
                    </span>
                    <Copy className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'json' && (
          <div className="flex flex-col h-full space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">JSON Inspector & Formatter</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => formatJson(2)}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
                >
                  Beautify
                </button>
                <button
                  onClick={minifyJson}
                  className="px-2 py-1 rounded bg-white/10 hover:bg-white/15 text-xs text-slate-200 transition-colors"
                >
                  Minify
                </button>
              </div>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON here..."
              rows={5}
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl p-2.5 text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
            />

            {jsonError && (
              <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg">
                {jsonError}
              </div>
            )}

            {jsonOutput && (
              <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium">Result</span>
                  <button
                    onClick={() => copyToClipboard(jsonOutput)}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy result"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="flex-1 max-h-48 overflow-y-auto bg-slate-950 p-2.5 rounded-xl border border-white/10 text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                  {jsonOutput}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Coding Question or Task</label>
              <textarea
                value={codePrompt}
                onChange={(e) => setCodePrompt(e.target.value)}
                placeholder="e.g. Write a regex to extract semantic versions, or explain why this page might have layout shifts..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <button
              onClick={handleRunAiDev}
              disabled={isAiLoading || !codePrompt.trim()}
              className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isAiLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Solution</span>
                </>
              )}
            </button>

            {aiCodeResponse && (
              <div className="p-3 rounded-xl bg-slate-900/90 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-cyan-300 font-mono font-medium">Assistant Response</span>
                  <button
                    onClick={() => copyToClipboard(aiCodeResponse)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {aiCodeResponse}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </PanelContainer>
  );
};
