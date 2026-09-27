import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { HyperlinkIcon } from '../common/HyperlinkIcon';

export const SelectionToolbar: React.FC = () => {
  const {
    openFeatureWithProps,
    settings,
    setSelectedText,
    refreshPageContext
  } = useHyperlink();

  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [currentSelection, setCurrentSelection] = useState('');

  useEffect(() => {
    if (!settings.enableSelectionToolbar) return;

    const handleMouseUp = (e: MouseEvent) => {
      // Piercing check: if selection is inside Hyperlink overlay or panels, do not trigger toolbar
      const path = e.composedPath();
      const isInsideHyperlink = path.some(
        el => (el as HTMLElement)?.id === 'hyperlink-root-container' ||
              (el as HTMLElement)?.id === 'hyperlink-extension-overlay'
      );
      if (isInsideHyperlink) {
        return;
      }

      // Delay slightly for selection to settle
      setTimeout(() => {
        const selection = window.getSelection();
        const text = selection?.toString().trim();

        if (text && text.length > 1) {
          try {
            const range = selection?.getRangeAt(0);
            const rect = range?.getBoundingClientRect();

            if (rect && rect.width > 0 && rect.height > 0) {
              // Position above selection if space permits, else below
              const top = rect.top > 56 ? rect.top - 46 : Math.min(window.innerHeight - 50, rect.bottom + 8);
              const left = Math.max(10, Math.min(window.innerWidth - 440, rect.left + rect.width / 2 - 200));

              setPosition({ top, left });
              setCurrentSelection(text);
              setSelectedText(text);
              setVisible(true);
            }
          } catch {
            // Detached range catch
          }
        }
      }, 60);
    };

    const handleMouseDown = (e: MouseEvent) => {
      const path = e.composedPath();
      const isInside = path.some(
        el => (el as HTMLElement)?.classList?.contains?.('hyperlink-selection-toolbar')
      );
      if (isInside) return;
      setVisible(false);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [settings.enableSelectionToolbar, setSelectedText]);

  if (!visible || !settings.enableSelectionToolbar) return null;

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setVisible(false);
    refreshPageContext();

    switch (action) {
      case 'ask':
        openFeatureWithProps('ai', { initialPrompt: `Regarding: "${currentSelection}": ` });
        break;
      case 'explain':
        openFeatureWithProps('ai', { mode: 'explain', targetText: currentSelection });
        break;
      case 'define':
        openFeatureWithProps('ai', { mode: 'define', targetText: currentSelection });
        break;
      case 'search':
        openFeatureWithProps('search', { query: currentSelection });
        break;
      case 'translate':
        openFeatureWithProps('translate', { text: currentSelection, autoTranslate: true });
        break;
      case 'read':
        openFeatureWithProps('reader', { text: currentSelection, autoPlay: true });
        break;
      case 'save':
        openFeatureWithProps('save', { initialText: currentSelection, type: 'selection' });
        break;
      default:
        break;
    }
  };

  return (
    <div
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="hyperlink-selection-toolbar fixed z-[2147483646] flex items-center gap-1 px-2.5 py-1 rounded-full backdrop-blur-2xl border select-none transition-all duration-150 animate-hyperlink-fade bg-[#0b0f19]/85 border-white/[0.12] shadow-[0_12px_36px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.18)] text-zinc-100"
    >
      <div className="flex items-center gap-1 px-1.5 py-0.5 text-xs font-bold border-r mr-0.5 shrink-0 text-indigo-400 border-white/[0.08]">
        <HyperlinkIcon name="Zap" size={12} className="fill-indigo-400" />
        <span className="text-[10px] tracking-wider font-mono uppercase">HYPERLINK</span>
      </div>

      <button
        type="button"
        onClick={(e) => handleAction('explain', e)}
        className="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.08]"
        title="Explain this text"
      >
        Explain
      </button>

      <button
        type="button"
        onClick={(e) => handleAction('define', e)}
        className="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.08]"
        title="Define term"
      >
        Define
      </button>

      <button
        type="button"
        onClick={(e) => handleAction('ask', e)}
        className="px-2 py-0.5 text-[11px] font-semibold rounded-full transition-colors cursor-pointer border text-indigo-300 hover:text-white bg-indigo-500/15 hover:bg-indigo-500/30 border-indigo-500/25"
        title="Ask question about this text"
      >
        Ask AI
      </button>

      <button
        type="button"
        onClick={(e) => handleAction('translate', e)}
        className="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.08]"
        title="Translate text"
      >
        Translate
      </button>

      <button
        type="button"
        onClick={(e) => handleAction('search', e)}
        className="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer text-zinc-300 hover:text-white hover:bg-white/[0.08]"
        title="Search web for text"
      >
        Search
      </button>

      <button
        type="button"
        onClick={(e) => handleAction('read', e)}
        className="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer text-cyan-300 hover:text-white hover:bg-cyan-500/20"
        title="Read text aloud"
      >
        Read
      </button>

      <button
        type="button"
        onClick={(e) => handleAction('save', e)}
        className="px-2 py-0.5 text-[11px] font-medium rounded-full transition-colors cursor-pointer text-amber-300 hover:text-white hover:bg-amber-500/20"
        title="Save to collections"
      >
        Save
      </button>
    </div>
  );
};
