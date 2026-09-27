import React, { useState, useEffect } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { storageService } from '../../services/storage/storageService';
import { SavedItem, SavedCollectionName } from '../../types';
import { HyperlinkButton } from '../../components/common/HyperlinkButton';
import { HyperlinkIcon } from '../../components/common/HyperlinkIcon';

export const SaveSharePanel: React.FC = () => {
  const { pageContext, featureProps, savedItems, refreshSavedItems, showToast } = useHyperlink();
  const [collection, setCollection] = useState<SavedCollectionName>('Research');
  const [title, setTitle] = useState(featureProps.title || pageContext.title || '');
  const [content, setContent] = useState(featureProps.initialText || pageContext.selectedText || pageContext.url || '');
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'save' | 'library'>('save');

  const collections: SavedCollectionName[] = [
    'Research',
    'Study',
    'Coding',
    'Work',
    'Ideas',
    'Shopping',
    'Watch Later'
  ];

  const handleSave = async () => {
    if (!title.trim()) return;

    try {
      await storageService.saveItem({
        type: featureProps.type || (pageContext.selectedText ? 'selection' : 'page'),
        title,
        content,
        url: pageContext.url,
        domain: pageContext.domain,
        collection,
        thumbnail: featureProps.thumbnail
      });

      await refreshSavedItems();
      showToast({ type: 'success', title: `Saved to "${collection}"` });
      setActiveTab('library');
    } catch (e: any) {
      showToast({ type: 'error', title: 'Save failed', message: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    await storageService.deleteSavedItem(id);
    await refreshSavedItems();
    showToast({ type: 'info', title: 'Item removed' });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: content,
          url: pageContext.url
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(`${title}\n${pageContext.url}\n\n${content}`);
      showToast({ type: 'success', title: 'Copied link and content to clipboard' });
    }
  };

  const displayedItems = savedItems.filter(item => {
    if (filterCollection === 'all') return true;
    return item.collection === filterCollection;
  });

  return (
    <PanelContainer
      title="Save & Share"
      iconName="Bookmark"
      subtitle={`Curate web knowledge into organized collections`}
    >
      <div className="space-y-4">
        {/* Toggle between Save New and Library */}
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('save')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'save' ? 'bg-sky-500/25 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Save Item
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'library' ? 'bg-sky-500/25 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Library ({savedItems.length})
          </button>
        </div>

        {activeTab === 'save' ? (
          <div className="space-y-3.5">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Item title..."
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-sky-400"
              />
            </div>

            {/* Collection Select */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Collection</label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value as any)}
                className="w-full bg-[#0a0e18] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-1 focus:ring-sky-400"
              >
                {collections.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Note/Content */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Content / Note</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                className="w-full bg-white/[0.05] border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-400 resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <HyperlinkButton
                onClick={handleSave}
                variant="primary"
                icon="Bookmark"
                className="flex-1"
              >
                Save to {collection}
              </HyperlinkButton>

              <HyperlinkButton
                onClick={handleShare}
                variant="secondary"
                icon="Share2"
                className="flex-1"
              >
                Share
              </HyperlinkButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setFilterCollection('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  filterCollection === 'all' ? 'bg-sky-500/25 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              {collections.map(col => (
                <button
                  key={col}
                  onClick={() => setFilterCollection(col)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    filterCollection === col ? 'bg-sky-500/25 text-white' : 'bg-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>

            {/* Items List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {displayedItems.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No saved items in this collection.
                </div>
              ) : (
                displayedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 text-xs transition-colors space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-white leading-tight">{item.title}</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-slate-400 hover:text-rose-400 p-1"
                      >
                        <HyperlinkIcon name="Trash2" size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                        {item.collection}
                      </span>
                      <span>{item.domain}</span>
                    </div>

                    {item.content && (
                      <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    )}

                    <div className="pt-1 flex items-center justify-between">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                      >
                        Open Source
                        <HyperlinkIcon name="ExternalLink" size={10} />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
