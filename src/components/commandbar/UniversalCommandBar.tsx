import React, { useState, useEffect, useRef } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { parseNaturalLanguageCommand, ParsedCommand } from '../../utils/commandParser';
import { HyperlinkIcon } from '../common/HyperlinkIcon';
import { Search } from 'lucide-react';

export const UniversalCommandBar: React.FC = () => {
  const {
    openFeatureWithProps,
    commandBarFocused,
    setCommandBarFocused,
    isCollapsed
  } = useHyperlink();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<ParsedCommand[]>([]);
  const [isOpenSuggestions, setIsOpenSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (commandBarFocused && inputRef.current) {
      inputRef.current.focus();
    }
  }, [commandBarFocused]);

  useEffect(() => {
    if (query.trim()) {
      const parsed = parseNaturalLanguageCommand(query);
      setSuggestions(parsed);
      setIsOpenSuggestions(true);
      setSelectedIndex(0);
    } else {
      setSuggestions([]);
      setIsOpenSuggestions(false);
    }
  }, [query]);

  const handleSelect = (item: ParsedCommand) => {
    openFeatureWithProps(item.featureId, item.extraArgs);
    setQuery('');
    setIsOpenSuggestions(false);
    setCommandBarFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, suggestions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % Math.max(1, suggestions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0) {
        handleSelect(suggestions[selectedIndex]);
      } else if (query.trim()) {
        openFeatureWithProps('ai', { initialPrompt: query });
        setQuery('');
        setIsOpenSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpenSuggestions(false);
      setCommandBarFocused(false);
    }
  };

  if (isCollapsed) return null;

  return (
    <div className="relative w-full z-50">
      <div className="relative flex items-center rounded-xl px-2.5 py-1.5 transition-all duration-150 bg-white/[0.04] hover:bg-white/[0.06] focus-within:bg-white/[0.08] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400/40 border border-white/[0.08]">
        <Search
          size={14}
          className="shrink-0 mr-2 text-zinc-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setCommandBarFocused(true);
            if (query.trim()) setIsOpenSuggestions(true);
          }}
          onBlur={() => {
            setTimeout(() => setIsOpenSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Command or search..."
          className="w-full bg-transparent text-xs outline-none font-medium selection:bg-indigo-500/30 text-white placeholder-zinc-500"
        />
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <kbd className="px-1.5 py-0.5 text-[9px] font-mono rounded shadow-sm text-zinc-400 bg-white/[0.05] border border-white/[0.08]">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Autocomplete / Command suggestions dropdown */}
      {isOpenSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl shadow-2xl overflow-hidden p-1.5 z-50 animate-hyperlink-fade max-h-72 overflow-y-auto backdrop-blur-2xl bg-[#0b0f19]/90 border border-white/[0.12] text-zinc-100">
          <div className="px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase mb-1 border-b text-zinc-400 border-white/[0.06]">
            Quick Actions
          </div>
          {suggestions.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <div
                key={item.featureId + item.title + index}
                onMouseDown={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors duration-150 ${
                  isSelected
                    ? 'bg-indigo-500/20 text-white border border-indigo-400/30 font-semibold'
                    : 'text-zinc-300 hover:bg-white/[0.05] border border-transparent'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-indigo-500/30 text-indigo-300'
                      : 'bg-white/[0.04] text-zinc-400'
                  }`}
                >
                  <HyperlinkIcon name={item.iconName} size={13} />
                </div>
                <div className="flex flex-col min-w-0 flex-1 truncate">
                  <span className="text-[12px] leading-none truncate font-semibold text-white">
                    {item.title}
                  </span>
                  <span className="text-[10px] mt-0.5 truncate text-zinc-400">
                    {item.subtitle}
                  </span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                  {item.category}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
