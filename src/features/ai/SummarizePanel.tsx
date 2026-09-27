import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { aiService } from '../../services/ai/AIService';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { MarkdownView } from '../../components/common/MarkdownView';
import { Copy, Check, Sparkles } from 'lucide-react';

export const SummarizePanel: React.FC = () => {
  const { pageContext, openFeatureWithProps, showToast, isLightMode, settings } = useHyperlink();
  const hasApiKey = !!(settings.aiConfig?.apiKey && settings.aiConfig.apiKey.trim().length > 0);
  const [summary, setSummary] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [mode, setMode] = useState<'page' | 'selection' | 'article' | 'video'>(
    pageContext.pageType === 'video' ? 'video' : pageContext.selectedText ? 'selection' : 'page'
  );

  const generateSummary = async (targetMode = mode) => {
    setLoading(true);
    try {
      let content = '';
      if (targetMode === 'selection' && pageContext.selectedText) {
        content = pageContext.selectedText;
      } else if (targetMode === 'article') {
        const overlay = document.getElementById('hyperlink-extension-overlay');
        const art = document.querySelector('article, [role="main"], main');
        if (art) {
          const clone = art.cloneNode(true) as HTMLElement;
          if (overlay) {
            const ov = clone.querySelector('#hyperlink-extension-overlay');
            if (ov) ov.remove();
          }
          content = clone.innerText;
        } else {
          content = document.body.innerText;
        }
      } else {
        content = document.body.innerText;
      }
      const res = await aiService.summarize(content, targetMode, pageContext);
      setSummary(res);
    } catch (e: any) {
      showToast({ type: 'error', title: 'Summarization Failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateSummary();
  }, [mode]);

  const handleCopy = async () => {
    if (!summary) return;
    await navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ type: 'success', title: 'Summary Copied to Clipboard' });
  };

  const handleSave = () => {
    openFeatureWithProps('save', {
      initialText: summary,
      title: `Summary of ${pageContext.title}`,
      type: 'ai_response'
    });
  };

  return (
    <PanelContainer
      title="Executive Summary"
      iconName="FileText"
      subtitle={`Source: ${pageContext.domain}`}
      headerActions={
        summary ? (
          <button
            onClick={handleCopy}
            title="Copy Summary"
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              isLightMode
                ? 'text-slate-500 hover:text-slate-900 hover:bg-black/[0.05]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
          </button>
        ) : null
      }
    >
      <div className="space-y-4">
        {/* 100% Free App & Groq Key Appeal Banner */}
        {!hasApiKey && (
          <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-[#0b0f19] text-xs space-y-2 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11.5px]">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Hyperlink is 100% Free • Boost Summaries</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                NO SUBSCRIPTIONS
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              Hyperlink is <strong>100% free</strong> with no fees. Connect your free <strong>Groq API key</strong> for deep, comprehensive summaries powered by Llama 3.1 8B Instant (takes 1 minute, no credit card required).
            </p>
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => openFeatureWithProps('settings')}
                className="py-1 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-sm"
              >
                <span>Add Free Key in Settings →</span>
              </button>
              <button
                type="button"
                onClick={() => window.open('https://console.groq.com/keys', '_blank')}
                className="py-1 px-2 text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                console.groq.com ↗
              </button>
            </div>
          </div>
        )}

        {/* Scope selector */}
        <div
          className={`flex items-center gap-1 p-1 rounded-xl border ${
            isLightMode ? 'bg-black/[0.03] border-black/[0.08]' : 'bg-white/[0.03] border-white/[0.06]'
          }`}
        >
          <button
            onClick={() => setMode('page')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'page'
                ? isLightMode
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold'
                  : 'bg-indigo-500/20 text-white border border-indigo-400/30'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Entire Page
          </button>
          {pageContext.selectedText && (
            <button
              onClick={() => setMode('selection')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                mode === 'selection'
                  ? isLightMode
                    ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold'
                    : 'bg-indigo-500/20 text-white border border-indigo-400/30'
                  : isLightMode
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                  : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              Selected Text
            </button>
          )}
          <button
            onClick={() => setMode('article')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              mode === 'article'
                ? isLightMode
                  ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 font-bold'
                  : 'bg-indigo-500/20 text-white border border-indigo-400/30'
                : isLightMode
                ? 'text-slate-600 hover:text-slate-900 hover:bg-black/[0.04]'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            Article Body
          </button>
        </div>

        {/* Loading / Result */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="w-7 h-7 rounded-full border-2 border-indigo-400/20 border-t-indigo-500 animate-spin" />
            <span
              className={`text-xs animate-pulse font-medium ${
                isLightMode ? 'text-slate-600' : 'text-zinc-400'
              }`}
            >
              Synthesizing executive brief...
            </span>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-2xl text-xs leading-relaxed select-text cursor-text shadow-sm ${
                isLightMode
                  ? 'bg-black/[0.06] backdrop-blur-md border border-black/[0.12] text-slate-950 font-medium'
                  : 'bg-white/[0.035] border border-white/[0.08] text-zinc-100 backdrop-blur-md'
              }`}
            >
              <MarkdownView content={summary} />
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2 pt-1">
              <HyperlinkButton
                onClick={handleCopy}
                variant="secondary"
                size="sm"
                icon="Copy"
                className="flex-1"
              >
                {copied ? 'Copied!' : 'Copy'}
              </HyperlinkButton>

              <HyperlinkButton
                onClick={handleSave}
                variant="secondary"
                size="sm"
                icon="Bookmark"
                className="flex-1"
              >
                Save
              </HyperlinkButton>

              <HyperlinkButton
                onClick={() =>
                  openFeatureWithProps('ai', {
                    initialPrompt: `Regarding this summary:\n${summary}\n\n`
                  })
                }
                variant="primary"
                size="sm"
                icon="Sparkles"
                className="flex-1"
              >
                Ask AI
              </HyperlinkButton>
            </div>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
