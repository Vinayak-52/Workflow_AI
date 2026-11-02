import React, { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Pin, Trash2, Sparkles, CheckCircle2,
  FileText, Tag, ArrowRight, Bot, BookOpen
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Note } from '../../types/index.ts';

export const NotesView: React.FC<{ onTaskCreated?: () => void }> = ({ onTaskCreated }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [search, setSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<string>('Saved');
  const [loading, setLoading] = useState(true);

  // AI Modal / Results
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const saveTimeoutRef = useRef<any>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setLoading(true);
    try {
      const res = await api.getNotes();
      setNotes(res.notes || []);
      if (res.notes && res.notes.length > 0 && !selectedNote) {
        setSelectedNote(res.notes[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNote = async () => {
    try {
      const res = await api.createNote({
        title: 'New Workspace Note',
        content: '# New Note\n\nWrite your thoughts or seminar notes here...',
        tags: ['general'],
        pinned: false
      });
      setNotes(prev => [res.note, ...prev]);
      setSelectedNote(res.note);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNoteChange = (updates: Partial<Note>) => {
    if (!selectedNote) return;

    const updated = { ...selectedNote, ...updates, updatedAt: new Date().toISOString() };
    setSelectedNote(updated);
    setNotes(prev => prev.map(n => (n.id === updated.id ? updated : n)));

    setSaveStatus('Saving...');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await api.updateNote(updated.id, updates);
        setSaveStatus(`Saved at ${new Date(res.autosavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      } catch (e) {
        setSaveStatus('Error saving');
      }
    }, 800);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await api.deleteNote(id);
      const remaining = notes.filter(n => n.id !== id);
      setNotes(remaining);
      setSelectedNote(remaining.length > 0 ? remaining[0] : null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePin = (note: Note) => {
    handleNoteChange({ pinned: !note.pinned });
  };

  const handleRunAI = async (action: 'summarize' | 'extract_tasks') => {
    if (!selectedNote) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.runNoteAI(selectedNote.id, action);
      setAiResult(res);
    } catch (e: any) {
      alert(`AI processing error: ${e.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAddCandidateTask = async (task: any) => {
    try {
      await api.createTask({
        title: task.title,
        category: 'academic',
        userPriority: 'medium',
        sourceType: 'note',
        sourceReference: `Note: ${selectedNote?.title}`
      });
      alert(`Created task "${task.title}"!`);
      if (onTaskCreated) onTaskCreated();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filteredNotes = notes.filter(n => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q) || n.tags.some(t => t.toLowerCase().includes(q));
  });

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col md:flex-row gap-4">
      {/* Left Pane: Notes List */}
      <div className="w-full md:w-80 flex flex-col bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden shrink-0">
        <div className="p-3.5 border-b border-charcoal-800 space-y-3 bg-charcoal-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-charcoal-300 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-500" /> Notes ({filteredNotes.length})
            </h2>
            <button
              onClick={handleCreateNote}
              className="p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition"
              title="Create note"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-charcoal-900 border border-charcoal-800 text-xs text-charcoal-300">
            <Search className="w-3.5 h-3.5 text-charcoal-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search notes or tags..."
              className="w-full bg-transparent border-none text-xs text-charcoal-100 placeholder-charcoal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Note Cards */}
        <div className="flex-1 overflow-y-auto divide-y divide-charcoal-850 p-2 space-y-1">
          {loading ? (
            <div className="p-8 text-center text-xs text-charcoal-500 italic">Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-charcoal-500">No matching notes.</div>
          ) : (
            filteredNotes.map(n => (
              <div
                key={n.id}
                onClick={() => setSelectedNote(n)}
                className={`p-3 rounded-xl cursor-pointer transition text-xs space-y-1 ${
                  selectedNote?.id === n.id
                    ? 'bg-charcoal-800/90 border border-charcoal-700'
                    : 'hover:bg-charcoal-850/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-charcoal-200 truncate pr-2 flex items-center gap-1.5">
                    {n.pinned && <Pin className="w-3 h-3 text-amber-400 rotate-45 shrink-0" />}
                    {n.title || 'Untitled Note'}
                  </h4>
                  <span className="text-[10px] text-charcoal-500 font-mono shrink-0">
                    {new Date(n.updatedAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-[11px] text-charcoal-400 line-clamp-2">
                  {n.content.replace(/[#*`]/g, '')}
                </p>
                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {n.tags.map(t => (
                      <span key={t} className="text-[9px] px-1.5 py-0.2 rounded bg-charcoal-800 text-charcoal-400">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane: Markdown Editor */}
      <div className="flex-1 flex flex-col bg-charcoal-900 border border-charcoal-800 rounded-2xl overflow-hidden">
        {selectedNote ? (
          <>
            {/* Note Editor Header */}
            <div className="p-4 border-b border-charcoal-800 flex flex-wrap items-center justify-between gap-3 bg-charcoal-950/30">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={e => handleNoteChange({ title: e.target.value })}
                  placeholder="Note Title..."
                  className="w-full bg-transparent font-bold text-base text-charcoal-100 placeholder-charcoal-500 border-none focus:outline-none"
                />
                <div className="flex items-center gap-3 mt-1 text-[11px] text-charcoal-500">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    {saveStatus}
                  </span>
                  <span>•</span>
                  <span>Markdown format</span>
                </div>
              </div>

              {/* Actions & AI Toolbar */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunAI('summarize')}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-brand-600/20 text-brand-400 hover:border-brand-500/40 border border-charcoal-700 text-xs font-medium transition"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Summarize
                </button>
                <button
                  onClick={() => handleRunAI('extract_tasks')}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-brand-600/20 text-brand-400 hover:border-brand-500/40 border border-charcoal-700 text-xs font-medium transition"
                >
                  <Bot className="w-3.5 h-3.5" /> Extract Tasks
                </button>
                <button
                  onClick={() => handleTogglePin(selectedNote)}
                  title={selectedNote.pinned ? 'Unpin' : 'Pin to top'}
                  className={`p-1.5 rounded-lg border transition ${
                    selectedNote.pinned
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-charcoal-800 text-charcoal-400 border-charcoal-700 hover:text-charcoal-200'
                  }`}
                >
                  <Pin className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(selectedNote.id)}
                  title="Delete note"
                  className="p-1.5 rounded-lg bg-charcoal-800 text-charcoal-400 border border-charcoal-700 hover:text-rose-400 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Note Editor Content */}
            <div className="flex-1 p-4 flex flex-col">
              <textarea
                value={selectedNote.content}
                onChange={e => handleNoteChange({ content: e.target.value })}
                placeholder="Write your note using Markdown (# Heading, - lists, **bold**, etc.)..."
                className="flex-1 w-full p-4 rounded-xl bg-charcoal-950/40 border border-charcoal-850 text-xs font-mono text-charcoal-200 placeholder-charcoal-600 focus:outline-none focus:border-charcoal-700 resize-none leading-relaxed"
              />
            </div>

            {/* AI Results Drawer / Card */}
            {aiResult && (
              <div className="p-4 border-t border-charcoal-800 bg-charcoal-950/80 animate-in slide-in-from-bottom duration-150 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Transformation Results ({aiResult.action})
                  </h4>
                  <button
                    onClick={() => setAiResult(null)}
                    className="text-xs text-charcoal-500 hover:text-charcoal-300"
                  >
                    Dismiss
                  </button>
                </div>

                {aiResult.action === 'summarize' && (
                  <div className="text-xs text-charcoal-300 space-y-2">
                    <div className="p-3 rounded-lg bg-charcoal-900 border border-charcoal-800">
                      <strong>Summary:</strong> {aiResult.summary}
                    </div>
                    {aiResult.keyTakeaways && (
                      <ul className="list-disc pl-5 space-y-1 text-charcoal-400 text-[11px]">
                        {aiResult.keyTakeaways.map((k: string, i: number) => (
                          <li key={i}>{k}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {aiResult.action === 'extract_tasks' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-charcoal-400">
                      Select candidate tasks to save into your workspace:
                    </p>
                    {aiResult.candidateTasks?.map((cTask: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-charcoal-900 border border-charcoal-800 flex items-center justify-between gap-2 text-xs"
                      >
                        <span className="text-charcoal-200">{cTask.title}</span>
                        <button
                          onClick={() => handleAddCandidateTask(cTask)}
                          className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-medium text-[11px]"
                        >
                          + Add Task
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-charcoal-500 text-xs space-y-3">
            <BookOpen className="w-12 h-12 text-charcoal-700" />
            <p>Select a note from the left sidebar or create a new note.</p>
            <button
              onClick={handleCreateNote}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium"
            >
              + Create Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
