import React, { useState, useEffect, useRef } from 'react';
import { api, Note } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import {
  Plus,
  Pin,
  PinOff,
  Trash2,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Heading1,
  Heading2,
  Bold,
  Italic,
  List,
  CheckSquare,
} from 'lucide-react';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes(search, activeTag !== 'all' ? activeTag : undefined);
      setNotes(res.notes);
      if (res.notes.length > 0 && !selectedNote) {
        setSelectedNote(res.notes[0]);
      } else if (selectedNote) {
        const updatedSelected = res.notes.find((n) => n.id === selectedNote.id);
        if (updatedSelected) setSelectedNote(updatedSelected);
      }
    } catch (err) {
      console.error('Error fetching notes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [search, activeTag]);

  const handleContentChange = (field: 'title' | 'content', value: string) => {
    if (!selectedNote) return;

    const updatedNote = { ...selectedNote, [field]: value };
    setSelectedNote(updatedNote);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.updateNote(updatedNote.id, { [field]: value });
        setNotes((prev) => prev.map((n) => (n.id === res.note.id ? res.note : n)));
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    }, 500);
  };

  const handleCreateNote = async () => {
    try {
      const res = await api.createNote({
        title: 'Untitled Note',
        content: '# Untitled Note\n\nWrite your thoughts, research, or meeting summaries here...',
        tags: ['notes'],
      });
      setNotes([res.note, ...notes]);
      setSelectedNote(res.note);
      setSaveStatus('saved');
    } catch {
      alert('Failed to create note');
    }
  };

  const handleTogglePin = async () => {
    if (!selectedNote) return;
    try {
      const res = await api.updateNote(selectedNote.id, { pinned: !selectedNote.pinned });
      setNotes((prev) =>
        prev
          .map((n) => (n.id === res.note.id ? res.note : n))
          .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))
      );
      setSelectedNote(res.note);
    } catch {
      alert('Failed to toggle pin state');
    }
  };

  const handleDeleteNote = async () => {
    if (!selectedNote || !confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.deleteNote(selectedNote.id);
      const remaining = notes.filter((n) => n.id !== selectedNote.id);
      setNotes(remaining);
      setSelectedNote(remaining.length > 0 ? remaining[0] : null);
    } catch {
      alert('Failed to delete note');
    }
  };

  const insertFormatting = (prefix: string, suffix = '') => {
    if (!selectedNote) return;
    const textarea = document.getElementById('note-body-textarea') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = selectedNote.content.substring(start, end) || 'text';
    const replacement = `${prefix}${selectedText}${suffix}`;
    const newContent =
      selectedNote.content.substring(0, start) +
      replacement +
      selectedNote.content.substring(end);

    handleContentChange('content', newContent);
  };

  // Extract all unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags || [])));

  return (
    <div className="h-[calc(100vh-100px)] flex gap-5">
      {/* Left Column: Note Explorer */}
      <div className="w-80 flex flex-col gap-3 h-full">
        {/* Search & New Note */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-[#12131b] border border-white/[0.08] focus:border-indigo-500/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none transition-colors"
            />
          </div>
          <Button size="sm" variant="primary" onClick={handleCreateNote}>
            <Plus size={14} /> New
          </Button>
        </div>

        {/* Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none">
          <button
            onClick={() => setActiveTag('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
              activeTag === 'all'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                : 'text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.05]'
            }`}
          >
            All Notes
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all ${
                activeTag === tag
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-white bg-white/[0.03] border border-white/[0.05]'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Note Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : notes.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-xs bg-white/[0.01] border border-white/[0.04] rounded-xl p-4">
              No notes found. Click "+ New" to create one.
            </div>
          ) : (
            notes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#181926] border-indigo-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.5)]'
                      : 'bg-[#12131b] border-white/[0.06] hover:border-white/[0.14] hover:bg-[#151622]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-xs text-white truncate flex-1 tracking-tight">
                      {note.title || 'Untitled Note'}
                    </h3>
                    {note.pinned && (
                      <Pin size={11} className="text-indigo-400 shrink-0 mt-0.5 fill-indigo-400/20" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-snug">
                    {note.content.replace(/[#*`_]/g, '') || 'Empty note...'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="default" className="text-[9px] px-1.5 py-0">
                        #{tag}
                      </Badge>
                    ))}
                    <span className="text-[10px] font-mono text-zinc-500 ml-auto">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Note Editor */}
      <div className="flex-1 h-full flex flex-col bg-[#12131b] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden">
        {selectedNote ? (
          <>
            {/* Editor Action Bar */}
            <div className="px-6 py-3 border-b border-white/[0.06] flex items-center justify-between bg-[#0e0f17]">
              {/* Left: Autosave Status */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-zinc-400 text-[11px] font-mono">
                      <RefreshCw size={11} className="animate-spin text-indigo-400" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px] font-mono">
                      <Check size={11} />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px] font-mono">
                      <AlertCircle size={11} />
                      Error saving
                    </span>
                  )}
                </div>

                <div className="h-4 w-[1px] bg-white/[0.08]" />

                {/* Markdown Formatting Controls */}
                <div className="flex items-center gap-1 text-zinc-400">
                  <button
                    onClick={() => insertFormatting('# ')}
                    title="Heading 1"
                    className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Heading1 size={14} />
                  </button>
                  <button
                    onClick={() => insertFormatting('## ')}
                    title="Heading 2"
                    className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Heading2 size={14} />
                  </button>
                  <button
                    onClick={() => insertFormatting('**', '**')}
                    title="Bold"
                    className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onClick={() => insertFormatting('*', '*')}
                    title="Italic"
                    className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    onClick={() => insertFormatting('- ')}
                    title="List"
                    className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <List size={14} />
                  </button>
                  <button
                    onClick={() => insertFormatting('- [ ] ')}
                    title="Checklist item"
                    className="p-1 rounded hover:bg-white/[0.06] hover:text-white transition-colors"
                  >
                    <CheckSquare size={14} />
                  </button>
                </div>
              </div>

              {/* Right: Pin & Delete Actions */}
              <div className="flex items-center gap-2">
                <Button size="xs" variant="subtle" onClick={handleTogglePin}>
                  {selectedNote.pinned ? (
                    <>
                      <PinOff size={12} className="text-indigo-400" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin size={12} />
                      Pin
                    </>
                  )}
                </Button>
                <Button size="xs" variant="danger" onClick={handleDeleteNote}>
                  <Trash2 size={12} />
                </Button>
              </div>
            </div>

            {/* Note Title Input */}
            <div className="px-8 pt-6 pb-2">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Note Title..."
                className="w-full bg-transparent text-xl font-bold text-white tracking-tight focus:outline-none placeholder-zinc-600"
              />
            </div>

            {/* Markdown Body Textarea */}
            <div className="flex-1 px-8 pb-6">
              <textarea
                id="note-body-textarea"
                value={selectedNote.content}
                onChange={(e) => handleContentChange('content', e.target.value)}
                placeholder="Start writing in Markdown (headings, lists, notes, or research)..."
                className="w-full h-full bg-transparent text-xs text-zinc-300 font-mono resize-none focus:outline-none placeholder-zinc-600 leading-relaxed"
              />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
            <p>Select a note from the left or create a new one to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};
