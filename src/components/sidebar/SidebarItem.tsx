import React from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { SidebarFeatureId } from '../../types';
import { HyperlinkIcon } from '../common/HyperlinkIcon';

interface SidebarItemProps {
  id: SidebarFeatureId;
  label: string;
  iconName: string;
  description?: string;
  badge?: string;
  shortcut?: string;
  isPrioritized?: boolean;
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  id,
  label,
  iconName,
  description,
  badge,
  shortcut,
  isPrioritized = false
}) => {
  const { activeFeature, openFeatureWithProps, isCollapsed } = useHyperlink();
  const isActive = activeFeature === id;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openFeatureWithProps(id);
  };

  const tooltipText = description ? `${label}: ${description}` : label;

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={handleClick}
        onMouseDown={(e) => e.stopPropagation()}
        title={tooltipText}
        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150 group cursor-pointer ${
          isActive
            ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/40 shadow-md shadow-indigo-500/20'
            : isPrioritized
            ? 'bg-white/[0.06] text-white border border-indigo-400/30 hover:bg-white/10'
            : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
        }`}
      >
        <HyperlinkIcon name={iconName} size={17} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseDown={(e) => e.stopPropagation()}
      title={tooltipText}
      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all duration-150 group cursor-pointer ${
        isActive
          ? 'bg-white/[0.12] text-white border border-white/[0.18] shadow-sm'
          : isPrioritized
          ? 'bg-white/[0.05] hover:bg-white/[0.09] text-zinc-100 border border-white/[0.08]'
          : 'text-zinc-200 hover:text-white hover:bg-white/[0.06] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shrink-0 ${
            isActive
              ? 'bg-indigo-600 text-white shadow-sm'
              : isPrioritized
              ? 'bg-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/30'
              : 'bg-white/[0.05] text-zinc-300 group-hover:text-white group-hover:bg-white/[0.1]'
          }`}
        >
          <HyperlinkIcon name={iconName} size={15} />
        </div>
        <span
          className={`text-[12.5px] leading-none tracking-tight truncate ${
            isActive
              ? 'text-white font-bold'
              : 'text-zinc-100 group-hover:text-white font-medium'
          }`}
        >
          {label}
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-2">
        {shortcut && (
          <kbd
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded shadow-sm ${
              isActive
                ? 'bg-white/[0.12] text-white border border-white/[0.2]'
                : 'bg-white/[0.05] text-zinc-400 group-hover:text-zinc-200 border border-white/[0.08]'
            }`}
          >
            {shortcut}
          </kbd>
        )}
      </div>
    </button>
  );
};
