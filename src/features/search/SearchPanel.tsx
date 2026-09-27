import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { Search, Globe, Check, X, ArrowUpRight } from 'lucide-react';

const SEARCH_ENGINES: Record<string, { name: string; url: (q: string) => string }> = {
  google: { name: 'Google', url: (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}` },
  duckduckgo: { name: 'DuckDuckGo', url: (q) => `https://duckduckgo.com/?q=${encodeURIComponent(q)}` },
  brave: { name: 'Brave Search', url: (q) => `https://search.brave.com/search?q=${encodeURIComponent(q)}` },
  perplexity: { name: 'Perplexity AI', url: (q) => `https://www.perplexity.ai/search?q=${encodeURIComponent(q)}` },
  bing: { name: 'Bing', url: (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}` },
};

export const SearchPanel: React.FC = () => {
  const { pageContext, featureProps, settings, updateSettings, isLightMode } = useHyperlink();
  const [query, setQuery] = useState(featureProps.query || pageContext.selectedText || pageContext.title || '');
  const [engine, setEngine] = useState(settings.defaultSearchEngine || 'google');

  useEffect(() => {
    if (featureProps.query) setQuery(featureProps.query);
  }, [featureProps.query]);

  const handleSearch = (customQuery?: string) => {
    const q = customQuery || query;
    if (!q.trim()) return;
    const provider = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google;
    window.open(provider.url(q), '_blank');
  };

  const handleSearchSite = () => {
    if (!query.trim() || !pageContext.domain) return;
    const siteQuery = `site:${pageContext.domain} ${query}`;
    const provider = SEARCH_ENGINES[engine] || SEARCH_ENGINES.google;
    window.open(provider.url(siteQuery), '_blank');
  };

  return (
    <PanelContainer
      title="Web Search"
      iconName="Search"
      subtitle="Search the web without leaving your workflow"
    >
      <div className="space-y-4 text-xs">
        {/* Search Input Box */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-bold ${isLightMode ? 'text-slate-950' : 'text-zinc-300'}`}>
            Search Query
          </label>
          <div
            className={`flex items-center gap-2 rounded-xl p-2 transition-all border ${
              isLightMode
                ? 'bg-black/[0.06] hover:bg-black/[0.09] focus-within:bg-black/[0.1] border-black/[0.14] focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-500/25'
                : 'bg-white/[0.04] hover:bg-white/[0.06] focus-within:bg-white/[0.08] border-white/[0.08] focus-within:border-indigo-400/40 focus-within:ring-2 focus-within:ring-indigo-500/20'
            }`}
          >
            <Search size={14} className={`ml-1 shrink-0 ${isLightMode ? 'text-slate-950' : 'text-zinc-400'}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search anything..."
              className={`flex-1 bg-transparent text-xs outline-none font-bold ${
                isLightMode ? 'text-slate-950 placeholder-slate-600' : 'text-white placeholder-zinc-500'
              }`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className={`p-1 transition-colors cursor-pointer ${isLightMode ? 'text-slate-700 hover:text-black' : 'text-zinc-400 hover:text-white'}`}
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Engine Selector */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-bold ${isLightMode ? 'text-slate-950' : 'text-zinc-300'}`}>
            Search Engine Provider
          </label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SEARCH_ENGINES).map(([key, item]) => {
              const isSelected = engine === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setEngine(key as any);
                    updateSettings({ defaultSearchEngine: key as any });
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 cursor-pointer ${
                    isSelected
                      ? isLightMode
                        ? 'bg-indigo-600/20 border-indigo-600/35 text-indigo-950 font-bold shadow-sm'
                        : 'bg-indigo-500/20 border-indigo-400/40 text-white shadow-sm shadow-indigo-500/10'
                      : isLightMode
                      ? 'bg-black/[0.05] border-black/[0.08] text-slate-950 hover:bg-black/[0.08]'
                      : 'bg-white/[0.03] border-white/[0.06] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span>{item.name}</span>
                  {isSelected && <Check size={13} className={isLightMode ? 'text-indigo-700' : 'text-indigo-400'} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Query Filters */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-semibold text-zinc-400">Quick Filters</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSearch(`${query} site:reddit.com`)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Reddit</span>
              <ArrowUpRight size={11} className="opacity-50" />
            </button>
            <button
              onClick={() => handleSearch(`${query} site:github.com`)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>GitHub</span>
              <ArrowUpRight size={11} className="opacity-50" />
            </button>
            <button
              onClick={() => handleSearch(`${query} tutorial or documentation`)}
              className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-zinc-300 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Docs / Guide</span>
              <ArrowUpRight size={11} className="opacity-50" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <HyperlinkButton
            onClick={() => handleSearch()}
            variant="primary"
            size="md"
            icon="Search"
            className="w-full"
          >
            Search on {SEARCH_ENGINES[engine]?.name || 'Web'}
          </HyperlinkButton>

          {pageContext.domain && (
            <HyperlinkButton
              onClick={handleSearchSite}
              variant="secondary"
              size="md"
              icon="Globe"
              className="w-full"
            >
              Search within {pageContext.domain}
            </HyperlinkButton>
          )}
        </div>
      </div>
    </PanelContainer>
  );
};
