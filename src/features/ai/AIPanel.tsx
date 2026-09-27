import React, { useState, useEffect, useRef } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { aiService } from '../../services/ai/AIService';
import { ChatMessage } from '../../types';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';
import { MarkdownView } from '../../components/common/MarkdownView';
import { Copy, Check, Send, Globe, Sparkles } from 'lucide-react';

export const AIPanel: React.FC = () => {
  const { pageContext, featureProps, showToast, isLightMode, settings, openFeatureWithProps } = useHyperlink();
  const hasApiKey = !!(settings.aiConfig?.apiKey && settings.aiConfig.apiKey.trim().length > 0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedTs = useRef<number | null>(null);

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Initialize with initial prompt or mode if passed
  useEffect(() => {
    if (featureProps._ts && featureProps._ts === lastProcessedTs.current) {
      return;
    }
    if (featureProps._ts) {
      lastProcessedTs.current = featureProps._ts;
    }

    if (featureProps.initialPrompt) {
      handleSend(featureProps.initialPrompt);
    } else if (featureProps.mode === 'explain' && featureProps.targetText) {
      handleExplain(featureProps.targetText);
    } else if (featureProps.mode === 'define' && featureProps.targetText) {
      handleDefine(featureProps.targetText);
    } else if (messages.length === 0) {
      // Welcome message tailored to page
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hi! I'm **Hyperlink AI**, connected to **"${pageContext.title}"**.\n\nAsk me anything about this page, request a concise summary, or explore the topic with real-time web context.\n\n💡 *Note: Hyperlink is **100% free**! For unlimited, lightning-fast responses powered by Llama 3.1 8B Instant, you can connect a free **Groq API key** in Settings (1-step signup, no credit card).*`,
          timestamp: Date.now()
        }
      ]);
    }
  }, [featureProps]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || inputValue;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    if (!contentToSend) {
      setInputValue('');
    }
    setLoading(true);
    setStreamingText('');

    try {
      const isSearchIntent = text.toLowerCase().includes('search') ||
        text.toLowerCase().includes('latest') ||
        text.toLowerCase().includes('news') ||
        text.toLowerCase().includes('update');

      const pageSnippet = (pageContext.articleText || document.body.innerText || '')
        .replace(/\s+/g, ' ')
        .slice(0, 4000);

      const conversationHistory = messages.slice(-4).map(m => ({
        role: m.role,
        content: m.content
      }));

      conversationHistory.push({ role: 'user', content: text.trim() });

      let fullResponse = '';
      const result = await aiService.query({
        prompt: text.trim(),
        systemPrompt: `You are Hyperlink AI, an ultra-fast in-browser copilot. The user is browsing "${pageContext.title}" (${pageContext.url}). Provide direct, structured, beautifully formatted markdown answers. If page context is relevant, reference it clearly.`,
        context: pageSnippet,
        messages: conversationHistory,
        webSearch: isSearchIntent,
        onStreamChunk: (chunk: string) => {
          fullResponse += chunk;
          setStreamingText(fullResponse);
        }
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: result.content || fullResponse || 'No response received from AI model.',
        sources: result.sources,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Query Failed',
        message: err.message || 'AI request failed'
      });
    } finally {
      setLoading(false);
      setStreamingText('');
    }
  };

  const handleExplain = async (target: string) => {
    setLoading(true);
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: `Explain this highlighted section:\n\n> "${target}"`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const result = await aiService.explain(target, false, pageContext.title);
      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: result,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      showToast({ type: 'error', title: 'Explanation failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDefine = async (term: string) => {
    setLoading(true);
    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: `Define the term: "${term}"`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      const def = await aiService.define(term);
      const definitionText = def.definition || def.simple || 'No definition available.';
      const termTitle = def.term || term;
      const content = `### **${termTitle}** ${def.pronunciation ? `*${def.pronunciation}*` : ''}\n\n**Definition**: ${definitionText}\n\n${def.partOfSpeech ? `*Part of speech: ${def.partOfSpeech}*\n` : ''}${def.example ? `> *"${def.example}"*\n\n` : ''}${def.synonyms && def.synonyms.length ? `**Synonyms**: ${def.synonyms.join(', ')}` : ''}`;
      const assistantMsg: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      showToast({ type: 'error', title: 'Definition lookup failed', message: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PanelContainer
      title="Ask AI Intelligence"
      iconName="Sparkles"
      subtitle={`Context: ${pageContext.domain}`}
    >
      <div className="flex flex-col h-[calc(100vh-130px)]">
        {/* 100% Free App & Free Groq Key Appeal Banner */}
        {!hasApiKey && (
          <div className="mb-3 p-3.5 rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/60 via-purple-950/40 to-[#0b0f19] text-xs space-y-2 shadow-lg shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5 text-[11.5px]">
                <Sparkles size={13} className="text-indigo-400" />
                <span>Hyperlink is 100% Free • Boost with Groq</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                NO SUBSCRIPTIONS
              </span>
            </div>
            <p className="text-[11px] text-zinc-300 leading-relaxed">
              This app is completely free with no subscriptions. Connect your own free <strong>Groq API key</strong> for instant, unlimited responses powered by Llama 3.1 8B Instant (takes 1 minute, no credit card required).
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

        {/* Messages Stream */}
        <div
          className={`flex-1 overflow-y-auto space-y-4 pr-1 select-text scrollbar-thin ${
            isLightMode
              ? 'scrollbar-thumb-black/10 hover:scrollbar-thumb-black/20 text-slate-900'
              : 'scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 text-slate-100'
          }`}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col select-text ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed select-text cursor-text ${
                  msg.role === 'user'
                    ? isLightMode
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm font-medium'
                      : 'bg-gradient-to-r from-indigo-500/25 to-violet-500/20 border border-indigo-400/35 text-white shadow-sm backdrop-blur-md font-medium'
                    : isLightMode
                    ? 'bg-black/[0.06] backdrop-blur-md border border-black/[0.12] text-slate-950 shadow-sm font-medium'
                    : 'bg-white/[0.035] backdrop-blur-md border border-white/[0.08] text-zinc-100 shadow-md shadow-black/30'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap select-text font-medium">{msg.content}</div>
                ) : (
                  <MarkdownView content={msg.content} />
                )}

                {/* Live Web Sources Indicator if live information was queried */}
                {msg.sources && msg.sources.length > 0 && (
                  <div
                    className={`mt-3 pt-2.5 border-t select-none ${
                      isLightMode ? 'border-black/[0.06]' : 'border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-500 mb-1.5">
                      <Globe size={11} />
                      <span>Verified Sources</span>
                    </div>
                    <div className="space-y-1">
                      {msg.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className={`flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg transition-colors border ${
                            isLightMode
                              ? 'text-slate-800 hover:text-indigo-700 bg-black/[0.03] hover:bg-black/[0.06] border-black/[0.06]'
                              : 'text-zinc-300 hover:text-indigo-300 hover:underline bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06]'
                          }`}
                        >
                          <span className="truncate mr-2 font-medium">{src.title}</span>
                          <HyperlinkIcon name="ExternalLink" size={11} className="shrink-0 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assistant Message Footer with One-Click Copy */}
                {msg.role === 'assistant' && (
                  <div
                    className={`flex items-center justify-between mt-2.5 pt-2 border-t text-[10px] select-none ${
                      isLightMode
                        ? 'border-black/[0.06] text-slate-500'
                        : 'border-white/[0.04] text-zinc-400'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 font-mono text-[9px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1]" />
                      Hyperlink Intelligence
                    </span>
                    <button
                      onClick={() => handleCopyMessage(msg.id, msg.content)}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                        isLightMode
                          ? 'hover:bg-black/[0.06] text-slate-600 hover:text-slate-900'
                          : 'hover:bg-white/[0.08] text-zinc-400 hover:text-white'
                      }`}
                      title="Copy response to clipboard"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 px-1 select-none ${
                  isLightMode ? 'text-slate-500' : 'text-zinc-500'
                }`}
              >
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}

          {/* Streaming chunk preview */}
          {loading && streamingText && (
            <div className="flex flex-col items-start select-text">
              <div
                className={`max-w-[92%] rounded-2xl px-4 py-3 text-xs leading-relaxed select-text cursor-text shadow-md ${
                  isLightMode
                    ? 'bg-black/[0.06] backdrop-blur-md border border-black/[0.12] text-slate-950 font-medium'
                    : 'bg-white/[0.035] backdrop-blur-md border border-white/[0.08] text-zinc-100'
                }`}
              >
                <MarkdownView content={streamingText} />
                <span className="inline-block w-1.5 h-3 ml-1 bg-indigo-500 animate-pulse" />
              </div>
            </div>
          )}

          {loading && !streamingText && (
            <div
              className={`flex items-center gap-2 text-xs p-2 ${
                isLightMode ? 'text-slate-900 font-bold' : 'text-zinc-400'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-indigo-400/20 border-t-indigo-500 animate-spin" />
              <span>Analyzing page content...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="pt-2 pb-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleSend('Summarize the key points of this page')}
              className={`text-[11px] px-2.5 py-1 rounded-full border shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                isLightMode
                  ? 'bg-black/[0.06] hover:bg-black/[0.1] border-black/[0.14] text-slate-950 hover:text-black font-bold'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.12] text-zinc-300 hover:text-white font-medium'
              }`}
            >
              <span>⚡ Summarize</span>
            </button>
            <button
              onClick={() => handleSend('What are the main arguments or takeaways?')}
              className={`text-[11px] px-2.5 py-1 rounded-full border shrink-0 transition-colors cursor-pointer ${
                isLightMode
                  ? 'bg-black/[0.06] hover:bg-black/[0.1] border-black/[0.14] text-slate-950 hover:text-black font-bold'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.12] text-zinc-300 hover:text-white font-medium'
              }`}
            >
              Key takeaways
            </button>
            <button
              onClick={() => handleSend('Explain this topic in simple terms (ELI5)')}
              className={`text-[11px] px-2.5 py-1 rounded-full border shrink-0 transition-colors cursor-pointer ${
                isLightMode
                  ? 'bg-black/[0.06] hover:bg-black/[0.1] border-black/[0.14] text-slate-950 hover:text-black font-bold'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.12] text-zinc-300 hover:text-white font-medium'
              }`}
            >
              Explain simply
            </button>
            <button
              onClick={() => handleSend('Find the latest updates and news on this')}
              className={`text-[11px] px-2.5 py-1 rounded-full border shrink-0 transition-colors flex items-center gap-1 cursor-pointer ${
                isLightMode
                  ? 'bg-black/[0.06] hover:bg-black/[0.1] border-black/[0.14] text-slate-950 hover:text-black font-bold'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.06] hover:border-white/[0.12] text-zinc-300 hover:text-white font-medium'
              }`}
            >
              <span>🌐 Web updates</span>
            </button>
          </div>
        </div>

        {/* Input Bar */}
        <div
          className={`relative pt-1 border-t shrink-0 ${
            isLightMode ? 'border-black/[0.1]' : 'border-white/[0.06]'
          }`}
        >
          <div
            className={`flex items-center gap-2 border rounded-2xl p-1.5 transition-all ${
              isLightMode
                ? 'bg-black/[0.06] hover:bg-black/[0.09] focus-within:bg-black/[0.1] border-black/[0.14] focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/25'
                : 'bg-white/[0.04] hover:bg-white/[0.06] focus-within:bg-white/[0.08] border-white/[0.08] focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-500/20'
            }`}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask anything about this page..."
              disabled={loading}
              className={`flex-1 bg-transparent px-3 py-1 text-xs outline-none font-bold ${
                isLightMode
                  ? 'text-slate-950 placeholder-slate-600'
                  : 'text-white placeholder-zinc-500 font-medium'
              }`}
            />
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || loading}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-black/[0.05] disabled:text-slate-400 text-white shadow-md shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </PanelContainer>
  );
};
