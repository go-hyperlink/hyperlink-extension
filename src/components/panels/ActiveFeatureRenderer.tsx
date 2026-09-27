import React from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { AIPanel } from '../../features/ai/AIPanel';
import { SearchPanel } from '../../features/search/SearchPanel';
import { SummarizePanel } from '../../features/ai/SummarizePanel';
import { ScreenshotPanel } from '../../features/screenshot/ScreenshotPanel';
import { RecorderPanel } from '../../features/recorder/RecorderPanel';
import { VideoToolsPanel } from '../../features/video/VideoToolsPanel';
import { CaptionsPanel } from '../../features/captions/CaptionsPanel';
import { ReadAloudPanel } from '../../features/reader/ReadAloudPanel';
import { CleanReaderPanel } from '../../features/reader/CleanReaderPanel';
import { PageToPdfPanel } from '../../features/pdf/PageToPdfPanel';
import { ExtractPanel } from '../../features/extract/ExtractPanel';
import { TranslatePanel } from '../../features/translate/TranslatePanel';
import { SaveSharePanel } from '../../features/save/SaveSharePanel';
import { TabManagerPanel } from '../../features/tabs/TabManagerPanel';
import { DevToolsPanel } from '../../features/devtools/DevToolsPanel';
import { SettingsPanel } from '../../features/settings/SettingsPanel';
import { ThemeModePanel } from '../../features/theme/ThemeModePanel';
import { NotesPanel } from '../../features/notes/NotesPanel';
import { MediaDownloaderPanel } from '../../features/media/MediaDownloaderPanel';

export const ActiveFeatureRenderer: React.FC = () => {
  const { activeFeature } = useHyperlink();

  if (!activeFeature) return null;

  switch (activeFeature) {
    case 'ai': return <AIPanel />;
    case 'search': return <SearchPanel />;
    case 'summarize': return <SummarizePanel />;
    case 'screenshot': return <ScreenshotPanel />;
    case 'recorder': return <RecorderPanel />;
    case 'video': return <VideoToolsPanel />;
    case 'media_downloader': return <MediaDownloaderPanel />;
    case 'captions': return <CaptionsPanel />;
    case 'reader': return <ReadAloudPanel />;
    case 'clean': return <CleanReaderPanel />;
    case 'pdf': return <PageToPdfPanel />;
    case 'notes': return <NotesPanel />;
    case 'extract': return <ExtractPanel />;
    case 'translate': return <TranslatePanel />;
    case 'save': return <SaveSharePanel />;
    case 'tabs': return <TabManagerPanel />;
    case 'devtools': return <DevToolsPanel />;
    case 'settings': return <SettingsPanel />;
    case 'theme': return <ThemeModePanel />;
    default: return null;
  }
};
