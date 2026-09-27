import React from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { HyperlinkIcon } from '../common/HyperlinkIcon';
import { Minus, X } from 'lucide-react';

export const BrandHeader: React.FC = () => {
  const {
    isCollapsed,
    toggleCollapsed,
    toggleOpen,
    pageContext,
  } = useHyperlink();

  const getPageTypeBadge = () => {
    switch (pageContext.pageType) {
      case 'video':
        return {
          label: 'Video Page',
          icon: 'PlaySquare',
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        };
      case 'pdf':
        return {
          label: 'PDF Mode',
          icon: 'FileDown',
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        };
      case 'shopping':
        return {
          label: 'Shopping',
          icon: 'Bookmark',
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        };
      case 'github':
        return {
          label: 'Repository',
          icon: 'Code',
          color: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
        };
      case 'article':
        return {
          label: 'Article View',
          icon: 'BookOpen',
          color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        };
      default:
        return null;
    }
  };

  const badge = getPageTypeBadge();

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-1">
        <button
          onClick={toggleCollapsed}
          title="Expand Hyperlink Command Center"
          className="relative w-10 h-10 rounded-2xl active:scale-95 border flex items-center justify-center transition-all duration-200 group cursor-pointer bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-indigo-400/40 text-indigo-400 shadow-md shadow-black/30"
        >
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-indigo-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <HyperlinkIcon
            name="Zap"
            size={18}
            className="fill-indigo-400/30 group-hover:scale-110 transition-transform"
          />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-2 ring-black/40" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 pb-2.5 border-b border-white/[0.08]">
      {/* Brand Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Jewel Logo */}
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 border border-white/20 shrink-0">
            <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 to-transparent" />
            <HyperlinkIcon name="Zap" size={15} className="fill-white drop-shadow-sm" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold tracking-tight text-[13px]">
                HYPERLINK
              </span>
              <span className="bg-white/[0.06] border border-white/[0.08] text-zinc-400 px-1.5 py-[1px] text-[9px] font-mono font-bold rounded">
                PRO
              </span>
            </div>
            <span
              className="text-[10px] font-mono tracking-tight -mt-0.5 truncate max-w-[115px] text-zinc-400 font-medium"
              title={pageContext.domain}
            >
              {pageContext.domain}
            </span>
          </div>
        </div>

        {/* Minimal Controls: Minimize, Close */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          <button
            onClick={toggleCollapsed}
            title="Compact mode"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          >
            <Minus size={13} />
          </button>

          <button
            onClick={toggleOpen}
            title="Close Hyperlink (Esc)"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-rose-300 hover:bg-rose-500/20"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Context Badge if specialized page detected */}
      {badge && (
        <div
          className={`flex items-center justify-between px-2.5 py-1 rounded-xl border text-[11px] font-medium backdrop-blur-md ${badge.color}`}
        >
          <div className="flex items-center gap-1.5">
            <HyperlinkIcon name={badge.icon} size={12} />
            <span>{badge.label}</span>
          </div>
          <span className="text-[9px] opacity-75 font-mono uppercase tracking-wider">
            detected
          </span>
        </div>
      )}
    </div>
  );
};
