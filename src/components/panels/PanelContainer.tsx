import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { HyperlinkIcon } from '../common/HyperlinkIcon';
import { Maximize2, Minimize2, X } from 'lucide-react';

interface PanelContainerProps {
  title?: string;
  iconName?: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: string;
  headerActions?: React.ReactNode;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({
  title = 'Hyperlink',
  iconName = 'Sparkles',
  subtitle,
  children,
  width = 'w-[450px]',
  headerActions
}) => {
  const { isCollapsed, closeFeaturePanel, settings } = useHyperlink();
  const [isMaximized, setIsMaximized] = useState(false);
  const [customWidth, setCustomWidth] = useState<number | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const isLeft = settings.sidebarPosition !== 'right';
  const leftOffset = isCollapsed ? 76 : 270;
  const rightOffset = isCollapsed ? 76 : 270;

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth: number;
      if (isLeft) {
        newWidth = e.clientX - leftOffset;
      } else {
        newWidth = window.innerWidth - rightOffset - e.clientX;
      }
      const minW = 340;
      const maxW = Math.max(minW + 50, window.innerWidth - (isCollapsed ? 90 : 290));
      setCustomWidth(Math.max(minW, Math.min(maxW, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, isLeft, leftOffset, rightOffset, isCollapsed]);

  // Compute width styling
  const maxAvailableWidth = Math.max(400, window.innerWidth - (isCollapsed ? 95 : 290));
  const styleWidth = isMaximized
    ? `${maxAvailableWidth}px`
    : customWidth
    ? `${customWidth}px`
    : undefined;

  return (
    <div
      style={{
        width: styleWidth,
        ...(isLeft ? { left: `${leftOffset}px` } : { right: `${rightOffset}px` }),
      }}
      className={`fixed top-3 bottom-3 z-[2147483644] flex flex-col ${
        !styleWidth ? width : ''
      } max-w-[calc(100vw-90px)] rounded-[22px] backdrop-blur-[28px] border border-white/[0.12] bg-[#0b0f19]/70 saturate-[180%] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7),inset_0_1px_1px_0_rgba(255,255,255,0.15)] text-zinc-100 overflow-hidden transition-all duration-150 select-text`}
    >
      {/* Resizable Edge Handle */}
      <div
        onMouseDown={startResize}
        onDoubleClick={() => setIsMaximized(!isMaximized)}
        title="Drag to resize panel or double-click to toggle full view"
        className={`absolute top-0 bottom-0 ${
          isLeft ? 'right-0' : 'left-0'
        } w-3 hover:w-3.5 cursor-col-resize hover:bg-indigo-400/20 active:bg-indigo-400/40 transition-all z-30 group flex items-center justify-center`}
      >
        <div className="w-[3px] h-9 rounded-full bg-white/10 group-hover:bg-indigo-400 transition-colors" />
      </div>

      {/* Panel Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-white/[0.02] shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm bg-gradient-to-br from-indigo-500/20 to-violet-500/20 text-indigo-300 border border-indigo-400/25">
            <HyperlinkIcon name={iconName} size={16} />
          </div>
          <div className="flex flex-col truncate">
            <h2 className="text-[13px] tracking-tight leading-none truncate text-white font-bold">
              {title}
            </h2>
            {subtitle && (
              <span className="text-[11px] mt-0.5 truncate text-zinc-400 font-medium">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {headerActions}

          {/* Full Page / Maximize Toggle */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore standard width' : 'Maximize to full width'}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-white hover:bg-white/[0.08]"
          >
            {isMaximized ? (
              <Minimize2 size={13} className="text-indigo-400" />
            ) : (
              <Maximize2 size={13} />
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={closeFeaturePanel}
            title="Close Panel (Esc)"
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer text-zinc-400 hover:text-rose-300 hover:bg-rose-500/20"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 scrollbar-thin scrollbar-thumb-white/15 hover:scrollbar-thumb-white/25 text-zinc-100 select-text">
        {children}
      </div>
    </div>
  );
};
