import React from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { HyperlinkIcon } from './HyperlinkIcon';

export const FloatingTrigger: React.FC = () => {
  const { isOpen, toggleOpen, settings } = useHyperlink();

  if (isOpen || !settings.enableFloatingTrigger) return null;

  const isLeft = settings.sidebarPosition !== 'right';

  return (
    <button
      id="hyperlink-floating-trigger"
      onClick={toggleOpen}
      title="Open Hyperlink (Ctrl+Space)"
      className={`fixed top-1/2 -translate-y-1/2 z-[2147483640] flex items-center justify-center w-7 hover:w-9 h-14 backdrop-blur-2xl border transition-all duration-200 group cursor-pointer ${
        isLeft ? 'left-0 rounded-r-2xl' : 'right-0 rounded-l-2xl'
      } bg-[#0b0f19]/75 hover:bg-[#0b0f19]/95 border-white/[0.1] hover:border-indigo-400/40 text-indigo-400 shadow-[0_8px_30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]`}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
        <HyperlinkIcon
          name="Zap"
          size={15}
          className="group-hover:scale-110 transition-all drop-shadow-sm fill-indigo-400/30 group-hover:fill-indigo-400"
        />
      </div>
    </button>
  );
};
