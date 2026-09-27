import React, { useState, useEffect, useRef } from 'react';
import { useHyperlink } from '../../context/HyperlinkContext';
import { PanelContainer } from '../../components/panels/PanelContainer';
import { noteService, NoteItem } from '../../services/notes/noteService';
import { MarkdownView } from '../../components/common/MarkdownView';
import {
  Plus,
  Search,
  Pin,
  Trash2,
  Copy,
  Check,
  Download,
  Link2,
  Quote,
  Eye,
  Edit3,
  Globe,
  Calendar,
  ArrowLeft,
  Bold,
  Italic,
  List,
  CheckSquare,
  Code
} from 'lucide-react';

export const NotesPanel: React.FC = () => {
  const { pageContext, selectedText, showToast } = useHyperlink();
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'page' | 'all'>('all');
  const [previewMode, setPreviewMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Active Note form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimerRef = useRef<any>(null);

  useEffect(() => {
    return noteService.subscribe((allNotes) => {
      setNotes(allNotes);
    });
  }, []);

  // When activeNoteId changes, populate form
  useEffect(() => {
    if (activeNoteId) {
      const active = notes.find((n) => n.id === activeNoteId);
      if (active) {
        setTitle(active.title);
        setContent(active.content);
        setPreviewMode(false);
      }
    }
  }, [activeNoteId]);

  // Debounced auto-save
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave(title, newContent);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave(newTitle, content);
  };

  const triggerAutoSave = (curTitle: string, curContent: string) => {
    if (!activeNoteId) return;
    setIsSaving(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(async () => {
      await noteService.saveNote({
        id: activeNoteId,
        title: curTitle || 'Untitled Note',
        content: curContent,
      });
      setIsSaving(false);
    }, 400);
  };

  const handleCreateNewNote = async () => {
    const newNote = await noteService.saveNote({
      title: pageContext.title ? `Notes on ${pageContext.title.slice(0, 30)}...` : 'Untitled Note',
      content: selectedText ? `> "${selectedText}"\n\n` : '',
      url: pageContext.url,
      domain: pageContext.domain,
      pageTitle: pageContext.title,
      tags: [pageContext.domain].filter(Boolean),
    });
    setActiveNoteId(newNote.id);
    setTitle(newNote.title);
    setContent(newNote.content);
    setPreviewMode(false);
    showToast({ type: 'success', title: 'New Note Created' });
  };

  const handleDeleteNote = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Delete this note permanently?')) {
      await noteService.deleteNote(id);
      if (activeNoteId === id) {
        setActiveNoteId(null);
        setTitle('');
        setContent('');
      }
      showToast({ type: 'info', title: 'Note Deleted' });
    }
  };

  const handleTogglePin = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = await noteService.togglePin(id);
    if (updated) {
      showToast({
        type: 'info',
        title: updated.pinned ? 'Note Pinned to Top' : 'Note Unpinned'
      });
    }
  };

  const handleCopyNote = () => {
    const fullText = `# ${title || 'Untitled Note'}\n\n${content}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast({ type: 'success', title: 'Note Copied to Clipboard' });
  };

  const handleDownloadNote = () => {
    const fullText = `# ${title || 'Untitled Note'}\n\n${content}\n\n---\n*Saved with Hyperlink on ${new Date().toLocaleString()}*`;
    const blob = new Blob([fullText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeTitle = (title || 'note').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    a.download = `${safeTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'Note Downloaded as Markdown' });
  };

  const insertTextAtCursor = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    handleContentChange(newContent);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 20);
  };

  const handleAttachPageContext = () => {
    const markdownLink = `\n\n📌 **Source**: [${pageContext.title || pageContext.domain}](${pageContext.url})\n`;
    handleContentChange(content + markdownLink);
    showToast({ type: 'info', title: 'Attached Current Page Link' });
  };

  const handleAttachSelection = () => {
    if (selectedText) {
      const quote = `\n\n> "${selectedText}"\n`;
      handleContentChange(content + quote);
      showToast({ type: 'info', title: 'Inserted Highlighted Text' });
    } else {
      showToast({ type: 'warning', title: 'No text selected on page' });
    }
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (filterScope === 'page') {
      if (n.domain !== pageContext.domain) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = n.title.toLowerCase().includes(q);
      const matchContent = n.content.toLowerCase().includes(q);
      const matchTags = n.tags.some(t => t.toLowerCase().includes(q));
      return matchTitle || matchContent || matchTags;
    }
    return true;
  }).sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <PanelContainer
      title="Notes & Notebook"
      iconName="Bookmark"
      subtitle={activeNote ? 'Edit and clip notes' : `${notes.length} saved notes`}
      width="w-[480px]"
      headerActions={
        <div className="flex items-center gap-1">
          <button
            onClick={handleCreateNewNote}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            title="Create new note"
          >
            <Plus size={13} />
            <span>New Note</span>
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full space-y-3 text-xs select-text">
        {/* Editor View */}
        {activeNoteId ? (
          <div className="flex flex-col h-full space-y-3 animate-hyperlink-fade">
            {/* Top Toolbar */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <button
                onClick={() => setActiveNoteId(null)}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer font-medium"
              >
                <ArrowLeft size={13} />
                <span>All Notes</span>
              </button>

              <div className="flex items-center gap-1">
                {/* Auto-save status */}
                <span className="text-[10px] font-mono mr-2 text-zinc-400">
                  {isSaving ? 'Saving...' : 'Saved'}
                </span>

                {/* Edit / Preview Toggle */}
                <button
                  onClick={() => setPreviewMode(!previewMode)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    previewMode
                      ? 'bg-indigo-500/25 border-indigo-400/40 text-indigo-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:text-white'
                  }`}
                  title={previewMode ? 'Switch to Edit' : 'Preview Markdown'}
                >
                  {previewMode ? <Edit3 size={13} /> : <Eye size={13} />}
                </button>

                {/* Pin Note */}
                <button
                  onClick={() => handleTogglePin(activeNoteId)}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    activeNote?.pinned
                      ? 'bg-amber-500/25 border-amber-400/40 text-amber-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                  title={activeNote?.pinned ? 'Unpin' : 'Pin to top'}
                >
                  <Pin size={13} />
                </button>

                {/* Copy Note */}
                <button
                  onClick={handleCopyNote}
                  className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy Markdown"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>

                {/* Download .md */}
                <button
                  onClick={handleDownloadNote}
                  className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Download Markdown (.md)"
                >
                  <Download size={13} />
                </button>

                {/* Delete Note */}
                <button
                  onClick={() => handleDeleteNote(activeNoteId)}
                  className="p-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Delete note"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Note Title Input */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Note Title..."
                className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-500 outline-none pb-1 border-b border-white/[0.08] focus:border-indigo-400/50 transition-colors"
              />
            </div>

            {/* Quick Context Clipping & Markdown Format Bar */}
            {!previewMode && (
              <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => insertTextAtCursor('**', '**')}
                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Bold"
                  >
                    <Bold size={12} />
                  </button>
                  <button
                    onClick={() => insertTextAtCursor('*', '*')}
                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Italic"
                  >
                    <Italic size={12} />
                  </button>
                  <button
                    onClick={() => insertTextAtCursor('\n- ')}
                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Bullet List"
                  >
                    <List size={12} />
                  </button>
                  <button
                    onClick={() => insertTextAtCursor('\n- [ ] ')}
                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Task Checklist"
                  >
                    <CheckSquare size={12} />
                  </button>
                  <button
                    onClick={() => insertTextAtCursor('```\n', '\n```')}
                    className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Code block"
                  >
                    <Code size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAttachPageContext}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 transition-all cursor-pointer"
                    title="Insert page link and title"
                  >
                    <Link2 size={11} />
                    <span>Attach Page</span>
                  </button>
                  {selectedText && (
                    <button
                      onClick={handleAttachSelection}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/25 transition-all cursor-pointer"
                      title="Insert selected quote"
                    >
                      <Quote size={11} />
                      <span>Attach Highlight</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Note Editor or Markdown Preview */}
            <div className="flex-1 min-h-[300px] flex flex-col">
              {previewMode ? (
                <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-y-auto max-h-[420px] scrollbar-thin">
                  <MarkdownView content={content || '*Empty note. Switch to edit to add content.*'} />
                </div>
              ) : (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => handleContentChange(e.target.value)}
                  placeholder="Write your note here using Markdown (bold, lists, quotes, code)..."
                  className="w-full flex-1 min-h-[300px] p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] focus:border-indigo-400/40 text-xs font-mono text-zinc-100 placeholder-zinc-500 outline-none resize-none leading-relaxed scrollbar-thin"
                />
              )}
            </div>

            {/* Bottom Meta Bar */}
            <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                <span>Updated: {new Date(activeNote?.updatedAt || Date.now()).toLocaleTimeString()}</span>
              </span>
              <span>
                {content.length} chars • {content.trim() ? content.trim().split(/\s+/).length : 0} words
              </span>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="flex flex-col h-full space-y-3">
            {/* Search & Scope Tabs */}
            <div className="space-y-2">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search saved notes..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs text-white placeholder-zinc-500 outline-none focus:border-indigo-400/40"
                />
              </div>

              <div className="flex items-center justify-between p-0.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <button
                  onClick={() => setFilterScope('all')}
                  className={`flex-1 py-1 rounded-lg text-center font-semibold text-[11px] transition-colors cursor-pointer ${
                    filterScope === 'all'
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All Notes ({notes.length})
                </button>
                <button
                  onClick={() => setFilterScope('page')}
                  className={`flex-1 py-1 rounded-lg text-center font-semibold text-[11px] transition-colors cursor-pointer ${
                    filterScope === 'page'
                      ? 'bg-white/[0.12] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  This Site ({notes.filter(n => n.domain === pageContext.domain).length})
                </button>
              </div>
            </div>

            {/* Note Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[460px] scrollbar-thin pr-0.5">
              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                  <p className="font-semibold text-zinc-300">No notes found</p>
                  <p className="text-[11px] text-zinc-500 mt-1">
                    {searchQuery ? 'Try a different search query' : 'Create your first note for this page or topic'}
                  </p>
                  <button
                    onClick={handleCreateNewNote}
                    className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Create Note</span>
                  </button>
                </div>
              ) : (
                filteredNotes.map((note) => {
                  return (
                    <div
                      key={note.id}
                      onClick={() => setActiveNoteId(note.id)}
                      className="group p-3 rounded-2xl border border-white/[0.08] hover:border-white/[0.16] bg-white/[0.03] hover:bg-white/[0.06] transition-all cursor-pointer relative"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {note.pinned && (
                            <Pin size={12} className="text-amber-400 fill-amber-400 shrink-0" />
                          )}
                          <h4 className="font-bold text-white text-xs truncate">
                            {note.title || 'Untitled Note'}
                          </h4>
                        </div>

                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => handleTogglePin(note.id, e)}
                            className="p-1 rounded hover:bg-white/[0.08] text-zinc-400 hover:text-white"
                            title={note.pinned ? 'Unpin' : 'Pin to top'}
                          >
                            <Pin size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="p-1 rounded hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                        {note.content.replace(/[#*`_>-]/g, '').trim() || 'No additional content...'}
                      </p>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/[0.04] text-[10px] text-zinc-500 font-mono">
                        {note.domain ? (
                          <span className="flex items-center gap-1 truncate max-w-[150px] text-indigo-300">
                            <Globe size={10} />
                            <span className="truncate">{note.domain}</span>
                          </span>
                        ) : (
                          <span>General Note</span>
                        )}
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </PanelContainer>
  );
};
