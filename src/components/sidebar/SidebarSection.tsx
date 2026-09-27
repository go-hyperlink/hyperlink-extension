import React, { useState } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { ChevronDown } from 'lucide-react';

interface SidebarSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  defaultOpen = true,
  children
}) => {
  const { isCollapsed } = useHyperlink();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-1.5 py-2 border-b border-white/[0.06]">
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2 py-1 text-[10px] uppercase tracking-wider transition-colors select-none group cursor-pointer text-zinc-400 hover:text-zinc-200 font-semibold"
      >
        <span className="group-hover:tracking-widest transition-all">{title}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            isOpen ? 'rotate-0' : '-rotate-90'
          } text-zinc-500 group-hover:text-zinc-300`}
        />
      </button>

      {isOpen && (
        <div className="flex flex-col gap-0.5 mt-0.5 animate-hyperlink-fade">
          {children}
        </div>
      )}
    </div>
  );
};
