import React from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { BrandHeader } from './BrandHeader';
import { UniversalCommandBar } from '../commandbar/UniversalCommandBar';
import { SidebarSection } from './SidebarSection';
import { SidebarItem } from './SidebarItem';
import { getPrioritizedFeatures } from '../../utils/pageContext';

export const Sidebar: React.FC = () => {
  const { isCollapsed, pageContext, settings } = useHyperlink();
  const prioritized = getPrioritizedFeatures(pageContext.pageType);

  const isPrioritized = (id: any) => prioritized.slice(0, 4).includes(id);

  return (
    <aside
      className={`fixed top-3 bottom-3 z-[2147483645] flex flex-col transition-all duration-300 ease-out select-none ${
        settings.sidebarPosition === 'right' ? 'right-3' : 'left-3'
      } ${
        isCollapsed ? 'w-14' : 'w-[245px]'
      } rounded-[22px] backdrop-blur-[28px] border border-white/[0.12] bg-[#0b0f19]/70 saturate-[180%] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.65),inset_0_1px_1px_0_rgba(255,255,255,0.14)] text-zinc-100 overflow-hidden`}
    >
      {/* Header with Brand */}
      <div className="p-3 shrink-0">
        <BrandHeader />
      </div>

      {/* Universal Command Bar */}
      {!isCollapsed && (
        <div className="px-3 pb-2 shrink-0">
          <UniversalCommandBar />
        </div>
      )}

      {/* Scrollable Tools List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-1 scrollbar-thin scrollbar-thumb-white/15 hover:scrollbar-thumb-white/25">
        {/* AI & Search */}
        <SidebarSection title="AI & Search">
          <SidebarItem
            id="ai"
            label="Ask AI"
            iconName="Sparkles"
            description="Page Q&A, explain, define"
            shortcut="⌘J"
            isPrioritized={isPrioritized('ai')}
          />
          <SidebarItem
            id="search"
            label="Search Web"
            iconName="Search"
            description="Live web, topics, selection"
            isPrioritized={isPrioritized('search')}
          />
          <SidebarItem
            id="summarize"
            label="Summarize"
            iconName="FileText"
            description="TL;DR executive brief"
            isPrioritized={isPrioritized('summarize')}
          />
        </SidebarSection>

        {/* Capture */}
        <SidebarSection title="Capture">
          <SidebarItem
            id="screenshot"
            label="Screenshot"
            iconName="Camera"
            description="Viewport, area, clean capture"
            isPrioritized={isPrioritized('screenshot')}
          />
          <SidebarItem
            id="recorder"
            label="Screen Record"
            iconName="Video"
            description="Tab, screen, mic audio"
            isPrioritized={isPrioritized('recorder')}
          />
        </SidebarSection>

        {/* Media */}
        <SidebarSection title="Media">
          <SidebarItem
            id="media_downloader"
            label="Media Downloader"
            iconName="Download"
            description="Download video & audio (YT, web)"
            isPrioritized={isPrioritized('media_downloader') || pageContext.hasVideo || pageContext.pageType === 'video'}
          />
          <SidebarItem
            id="video"
            label="Video Tools"
            iconName="PlaySquare"
            description="Speed, PiP, loop, capture"
            isPrioritized={isPrioritized('video')}
          />
          <SidebarItem
            id="captions"
            label="Live Caption"
            iconName="Captions"
            description="Real-time speech subtitles"
            isPrioritized={isPrioritized('captions')}
          />
          <SidebarItem
            id="reader"
            label="Read Aloud"
            iconName="Volume2"
            description="Text-to-speech narrator"
            isPrioritized={isPrioritized('reader')}
          />
        </SidebarSection>

        {/* Notes & Save */}
        <SidebarSection title="Notes & Save">
          <SidebarItem
            id="notes"
            label="Notes"
            iconName="FileEdit"
            description="Quick notes, markdown, clipping"
            isPrioritized={isPrioritized('notes')}
          />
          <SidebarItem
            id="save"
            label="Save & Share"
            iconName="Bookmark"
            description="Collections & web share"
            isPrioritized={isPrioritized('save')}
          />
          <SidebarItem
            id="pdf"
            label="Page → PDF"
            iconName="FileDown"
            description="Clean print layout & download"
            isPrioritized={isPrioritized('pdf')}
          />
        </SidebarSection>

        {/* Tools */}
        <SidebarSection title="Tools">
          <SidebarItem
            id="extract"
            label="Extract Content"
            iconName="Database"
            description="Emails, links, prices, tables"
            isPrioritized={isPrioritized('extract')}
          />
          <SidebarItem
            id="clean"
            label="Clean Page"
            iconName="BookOpen"
            description="Distraction-free reading"
            isPrioritized={isPrioritized('clean')}
          />
          <SidebarItem
            id="translate"
            label="Translate"
            iconName="Languages"
            description="Multi-language translation"
            isPrioritized={isPrioritized('translate')}
          />
          <SidebarItem
            id="theme"
            label="Page Theme"
            iconName="Palette"
            description="Dark mode, sepia, midnight"
            isPrioritized={isPrioritized('theme')}
          />
        </SidebarSection>

        {/* Browser */}
        <SidebarSection title="Browser">
          <SidebarItem
            id="tabs"
            label="Tab Manager"
            iconName="Layers"
            description="Deduplicate, group, sessions"
            isPrioritized={isPrioritized('tabs')}
          />
        </SidebarSection>

        {/* System & More */}
        <SidebarSection title="System">
          <SidebarItem
            id="devtools"
            label="Developer Tools"
            iconName="Terminal"
            description="Inspect, code AI, JSON, colors"
            isPrioritized={isPrioritized('devtools')}
          />
          <SidebarItem
            id="settings"
            label="Settings"
            iconName="Settings"
            description="Keys, engines, preferences"
          />
        </SidebarSection>
      </div>

      {/* Bottom Status Bar */}
      {!isCollapsed && (
        <div className="px-3 py-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400 bg-white/[0.02]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-zinc-200">Ready</span>
          </span>
          <span className="font-mono text-[9px] text-zinc-400">Ctrl+Space</span>
        </div>
      )}
    </aside>
  );
};
