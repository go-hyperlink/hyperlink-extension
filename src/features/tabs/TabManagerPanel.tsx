import React, { useState, useEffect, useCallback } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { tabService, TabItem, TabSession } from '../../services/tabs/tabService';
import { 
  Search, 
  X, 
  Copy, 
  Layers, 
  RotateCcw, 
  Trash2, 
  Pin,
  BookmarkPlus,
  RefreshCw,
  Volume2,
  VolumeX,
  ExternalLink,
  Plus
} from 'lucide-react';

export const TabManagerPanel: React.FC = () => {
  const { addToast } = useHyperlink();
  const [tabs, setTabs] = useState<TabItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedSessions, setSavedSessions] = useState<TabSession[]>([]);
  const [viewMode, setViewMode] = useState<'open' | 'sessions'>('open');
  const [sessionName, setSessionName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadTabs = useCallback(async () => {
    setLoading(true);
    try {
      const allTabs = await tabService.getAllTabs();
      setTabs(allTabs);
    } catch {
      addToast('Could not load browser tabs', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const loadSessions = useCallback(() => {
    setSavedSessions(tabService.getSavedSessions());
  }, []);

  useEffect(() => {
    loadTabs();
    loadSessions();
  }, [loadTabs, loadSessions]);

  const handleCloseTab = async (e: React.MouseEvent, tabId: number) => {
    e.stopPropagation();
    const success = await tabService.closeTab(tabId);
    if (success) {
      setTabs(prev => prev.filter(t => t.id !== tabId));
      addToast('Tab closed', 'info');
    } else {
      await loadTabs();
    }
  };

  const handleSwitchTab = async (tab: TabItem) => {
    await tabService.switchToTab(tab.id, tab.windowId);
  };

  const handleTogglePin = async (e: React.MouseEvent, tab: TabItem) => {
    e.stopPropagation();
    await tabService.togglePin(tab.id, tab.pinned);
    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, pinned: !t.pinned } : t));
    addToast(tab.pinned ? 'Tab unpinned' : 'Tab pinned', 'info');
  };

  const handleToggleMute = async (e: React.MouseEvent, tab: TabItem) => {
    e.stopPropagation();
    await tabService.toggleMute(tab.id, !!tab.muted);
    setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, muted: !t.muted } : t));
    addToast(tab.muted ? 'Tab unmuted' : 'Tab muted', 'info');
  };

  const handleCloseDuplicates = async () => {
    const closedCount = await tabService.closeDuplicates();
    if (closedCount > 0) {
      await loadTabs();
      addToast(`Closed ${closedCount} duplicate tab${closedCount > 1 ? 's' : ''}`, 'success');
    } else {
      addToast('No duplicate tabs found', 'info');
    }
  };

  const handleSaveSession = async () => {
    if (!sessionName.trim()) {
      addToast('Please enter a session name', 'error');
      return;
    }
    await tabService.saveCurrentSession(sessionName.trim());
    setSessionName('');
    setIsSaving(false);
    loadSessions();
    addToast('Tab session saved successfully', 'success');
  };

  const handleRestoreSession = async (sessionId: string) => {
    await tabService.restoreSession(sessionId);
    addToast('Restoring tabs from session...', 'info');
    setTimeout(loadTabs, 1000);
  };

  const handleDeleteSession = (sessionId: string) => {
    const updated = savedSessions.filter(s => s.id !== sessionId);
    localStorage.setItem('hyperlink_tab_sessions', JSON.stringify(updated));
    setSavedSessions(updated);
    addToast('Session deleted', 'info');
  };

  const filteredTabs = tabs.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PanelContainer
      title="Tab Manager"
      iconName="Layers"
      subtitle={`${tabs.length} tabs open across windows`}
      headerActions={
        <div className="flex items-center gap-1">
          <button
            onClick={loadTabs}
            title="Refresh Tabs"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCloseDuplicates}
            title="Deduplicate (Close duplicates)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
        </div>
      }
    >
      <div className="space-y-3.5">
        {/* Navigation & Actions Bar */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 bg-white/[0.04] p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('open')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'open' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Open Tabs ({tabs.length})
            </button>
            <button
              onClick={() => setViewMode('sessions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'sessions' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sessions ({savedSessions.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSaving(prev => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 hover:text-white border border-white/10 transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Save Session</span>
            </button>
          </div>
        </div>

        {/* Save Session Dialog */}
        {isSaving && (
          <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-2">
            <input
              type="text"
              placeholder="Session name (e.g. Research, Project)..."
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveSession()}
              autoFocus
            />
            <button
              onClick={handleSaveSession}
              className="px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => setIsSaving(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Search Bar for Open Tabs */}
        {viewMode === 'open' && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Filter ${tabs.length} open tabs by title or domain...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/60"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* List Content */}
        <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-0.5">
          {viewMode === 'open' ? (
            filteredTabs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                {searchQuery ? 'No matching tabs found.' : 'No tabs open.'}
              </div>
            ) : (
              filteredTabs.map(tab => {
                const urlHost = tab.url ? (() => {
                  try { return new URL(tab.url).hostname; } catch { return tab.url; }
                })() : '';

                return (
                  <div
                    key={tab.id}
                    onClick={() => handleSwitchTab(tab)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                      tab.active
                        ? 'bg-cyan-500/15 border-cyan-500/40 text-white shadow-sm shadow-cyan-500/10'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.08] hover:border-white/15 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {tab.favIconUrl ? (
                        <img 
                          src={tab.favIconUrl} 
                          alt="" 
                          className="w-4 h-4 rounded-sm flex-shrink-0 object-contain"
                          onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                        />
                      ) : (
                        <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-medium truncate block text-slate-100">
                            {tab.title}
                          </span>
                          {tab.pinned && (
                            <Pin className="w-2.5 h-2.5 text-amber-400 flex-shrink-0 fill-amber-400/40" />
                          )}
                          {tab.audible && (
                            <span className="flex-shrink-0 text-emerald-400" title="Audio playing">
                              <Volume2 className="w-3 h-3 animate-pulse" />
                            </span>
                          )}
                          {tab.muted && (
                            <span className="flex-shrink-0 text-rose-400" title="Tab muted">
                              <VolumeX className="w-3 h-3" />
                            </span>
                          )}
                          {tab.active && (
                            <span className="px-1.5 py-0.5 bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-[9px] rounded-full font-mono flex-shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {urlHost}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                      <button
                        onClick={(e) => handleTogglePin(e, tab)}
                        className={`p-1 rounded-md transition-colors ${
                          tab.pinned ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                        title={tab.pinned ? 'Unpin tab' : 'Pin tab'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>

                      {tab.audible !== undefined && (
                        <button
                          onClick={(e) => handleToggleMute(e, tab)}
                          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                          title={tab.muted ? 'Unmute tab' : 'Mute tab'}
                        >
                          {tab.muted ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                        </button>
                      )}

                      <button
                        onClick={(e) => handleCloseTab(e, tab.id)}
                        className="p-1 rounded-md hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 transition-colors"
                        title="Close Tab"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            savedSessions.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No saved sessions yet. Click "Save Session" above to bookmark your current tab set.
              </div>
            ) : (
              savedSessions.map(session => (
                <div
                  key={session.id}
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{session.name}</h4>
                      <p className="text-[10px] text-slate-400">
                        {session.tabs.length} tabs • {new Date(session.timestamp).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleRestoreSession(session.id)}
                        className="px-2.5 py-1 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer border border-cyan-500/30"
                        title="Restore all tabs in this session"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restore</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-1.5 rounded-xl hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                    {session.tabs.map((tab, idx) => (
                      <div key={idx} className="text-[10px] text-slate-300 truncate flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 flex-shrink-0" />
                        <span className="truncate">{tab.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </PanelContainer>
  );
};
