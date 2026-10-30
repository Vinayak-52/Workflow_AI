import React, { useState, useEffect, useRef } from 'react';
import { api, Note } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Plus, Pin, PinOff, Trash2, Search, Check, AlertCircle, RefreshCw } from 'lucide-react';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Debounced autosave ref
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getNotes(search);
      setNotes(res.notes);
      if (res.notes.length > 0 && !selectedNote) {
        setSelectedNote(res.notes[0]);
      } else if (selectedNote) {
        const updatedSelected = res.notes.find(n => n.id === selectedNote.id);
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
  }, [search]);

  // Handle note content/title changes with debounced autosave
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
      } catch (err) {
        setSaveStatus('error');
      }
    }, 500);
  };

  const handleCreateNote = async () => {
    try {
      const res = await api.createNote({
        title: 'New Note',
        content: '# New Note\n\nWrite your thoughts here...',
        tags: ['draft'],
      });
      setNotes([res.note, ...notes]);
      setSelectedNote(res.note);
      setSaveStatus('saved');
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      alert('Failed to delete note');
    }
  };

  return (
    <div className="h-full flex gap-5">
      {/* Left Column: Note List */}
      <div className="w-80 flex flex-col gap-3 h-full">
        <div className="flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full bg-workspace-card border border-workspace-border rounded-md pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <Button size="sm" variant="primary" onClick={handleCreateNote}>
            <Plus size={14} /> New
          </Button>
        </div>

        {/* Note Cards List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-md" />
            ))
          ) : notes.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              No notes found. Create your first note!
            </div>
          ) : (
            notes.map((note) => {
              const isSelected = selectedNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-workspace-cardHover border-indigo-500/50 shadow-sm'
                      : 'bg-workspace-card border-workspace-border hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-xs text-zinc-100 truncate flex-1">
                      {note.title || 'Untitled Note'}
                    </h3>
                    {note.pinned && (
                      <Pin size={12} className="text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1">
                    {note.content.replace(/[#*`_]/g, '') || 'Empty content'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {note.tags.map((tag) => (
                      <Badge key={tag} variant="default" className="text-[10px] py-0 px-1.5">
                        {tag}
                      </Badge>
                    ))}
                    <span className="text-[10px] text-zinc-600 ml-auto">
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
      <div className="flex-1 h-full flex flex-col bg-workspace-card border border-workspace-border rounded-lg overflow-hidden">
        {selectedNote ? (
          <>
            {/* Editor Action Bar */}
            <div className="px-5 py-2.5 border-b border-workspace-border flex items-center justify-between bg-workspace-card/50">
              <div className="flex items-center gap-3">
                {/* Autosave Status Indicator */}
                <div className="flex items-center gap-1.5 text-xs">
                  {saveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-zinc-400 text-[11px]">
                      <RefreshCw size={12} className="animate-spin text-indigo-400" />
                      Saving...
                    </span>
                  )}
                  {saveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
                      <Check size={12} />
                      Saved
                    </span>
                  )}
                  {saveStatus === 'error' && (
                    <span className="flex items-center gap-1 text-rose-400 text-[11px]">
                      <AlertCircle size={12} />
                      Error saving
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={handleTogglePin}>
                  {selectedNote.pinned ? (
                    <>
                      <PinOff size={14} className="text-indigo-400" />
                      Unpin
                    </>
                  ) : (
                    <>
                      <Pin size={14} />
                      Pin
                    </>
                  )}
                </Button>
                <Button size="sm" variant="danger" onClick={handleDeleteNote}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>

            {/* Note Title Input */}
            <div className="px-6 pt-4 pb-2">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => handleContentChange('title', e.target.value)}
                placeholder="Note Title"
                className="w-full bg-transparent text-lg font-bold text-zinc-100 focus:outline-none placeholder-zinc-600"
              />
            </div>

            {/* Markdown Body Textarea */}
            <div className="flex-1 px-6 pb-4">
              <textarea
                value={selectedNote.content}
                onChange={(e) => handleContentChange('content', e.target.value)}
                placeholder="Write in Markdown..."
                className="w-full h-full bg-transparent text-xs text-zinc-300 font-mono resize-none focus:outline-none placeholder-zinc-600 leading-relaxed"
              />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs">
            <p>Select a note or create a new one to begin editing.</p>
          </div>
        )}
      </div>
    </div>
  );
};
