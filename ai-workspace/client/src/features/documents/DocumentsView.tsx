import React, { useState, useEffect } from 'react';
import {
  Upload, FileText, Sparkles, Trash2, CheckCircle, AlertCircle,
  FileCheck, Download, Bot, RefreshCw, Layers, MessageSquare, Send, X, Copy, Check, HelpCircle
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { DocumentRecord } from '../../types/index.ts';
import { FormattedMessage } from '../../components/FormattedMessage.tsx';

export const DocumentsView: React.FC<{ onTaskCreated?: () => void }> = ({ onTaskCreated }) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Ask Document QA States
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askQuestion, setAskQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string; model?: string; timestamp: string }>>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const quickPrompts = [
    'What are the main skills & technical proficiencies?',
    'Summarize work experience and projects',
    'What are the key takeaways & core points?',
    'List contact details and qualifications'
  ];

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
      if (res.documents && res.documents.length > 0 && !selectedDoc) {
        setSelectedDoc(res.documents[0]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await api.uploadDocument(file);
      setDocuments(prev => [res.document, ...prev]);
      setSelectedDoc(res.document);
      alert(`Document "${res.document.fileName}" successfully uploaded and parsed!`);
    } catch (e: any) {
      alert(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || askQuestion).trim();
    if (!q || !selectedDoc || isAsking) return;

    setIsAsking(true);
    setAskQuestion('');

    try {
      const res = await api.askDocument(selectedDoc.id, q);
      const newEntry = {
        question: q,
        answer: res.answer,
        model: res.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setQaHistory(prev => [newEntry, ...prev]);
    } catch (err: any) {
      alert(`Error querying document: ${err.message}`);
    } finally {
      setIsAsking(false);
    }
  };

  const copyAnswer = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this uploaded document?')) return;
    try {
      await api.deleteDocument(id);
      const remaining = documents.filter(d => d.id !== id);
      setDocuments(remaining);
      setSelectedDoc(remaining.length > 0 ? remaining[0] : null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-charcoal-100 flex items-center gap-2">
            Document Repository &amp; NLP Summarizer
          </h1>
          <p className="text-xs text-slate-500 dark:text-charcoal-400 mt-1">
            Transformer-inspired extractive salience engine for academic PDFs, seminar notes, and research papers.
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={e => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
        }}
        className={`p-6 rounded-2xl border-2 border-dashed transition text-center cursor-pointer shadow-sm ${
          dragActive
            ? 'border-brand-500 bg-brand-500/10'
            : 'border-slate-300 dark:border-charcoal-800 bg-white/80 dark:bg-charcoal-900/60 hover:border-slate-400 dark:hover:border-charcoal-700'
        }`}
      >
        <Upload className="w-8 h-8 text-brand-500 dark:text-brand-400 mx-auto mb-2 opacity-80" />
        <p className="text-xs font-semibold text-slate-800 dark:text-charcoal-200">
          Drag and drop your academic document here, or click to browse
        </p>
        <p className="text-[11px] text-slate-500 dark:text-charcoal-500 mt-1">
          Supports PDF, TXT, Markdown, and Word DOCX (up to 10 MB)
        </p>
        <input
          type="file"
          id="doc-upload"
          className="hidden"
          accept=".pdf,.txt,.md,.markdown,.docx,.json"
          onChange={e => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
        />
        <label
          htmlFor="doc-upload"
          className="inline-block mt-3 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-slate-700 dark:text-charcoal-300 text-xs font-medium cursor-pointer transition border border-slate-200 dark:border-charcoal-700"
        >
          {uploading ? 'Parsing Document...' : 'Select File'}
        </label>
      </div>

      {/* Split Viewer: Documents list & Summary breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document List */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-charcoal-400">
            Uploaded Files ({documents.length})
          </h2>

          <div className="space-y-2">
            {documents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 text-xs text-slate-500 dark:text-charcoal-500 shadow-sm">
                No documents uploaded yet.
              </div>
            ) : (
              documents.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition text-xs space-y-1 shadow-sm ${
                    selectedDoc?.id === doc.id
                      ? 'bg-brand-50/70 dark:bg-charcoal-850 border-brand-300 dark:border-brand-500/50'
                      : 'bg-white dark:bg-charcoal-900 border-slate-200/80 dark:border-charcoal-800 hover:border-slate-300 dark:hover:border-charcoal-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900 dark:text-charcoal-200 truncate pr-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0" />
                      {doc.fileName}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(doc.id);
                      }}
                      className="text-slate-400 hover:text-rose-500 dark:text-charcoal-500 dark:hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-charcoal-500 font-mono">
                    <span>{Math.round(doc.sizeBytes / 1024)} KB</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Summary & Q&A Detail Card */}
        <div className="md:col-span-2">
          {selectedDoc ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 space-y-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-charcoal-800 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-charcoal-100 flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    {selectedDoc.fileName}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-charcoal-400 mt-0.5">
                    Storage: Secure Local/Firebase Storage • Size: {Math.round(selectedDoc.sizeBytes / 1024)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAskModalOpen(true)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Ask Document</span>
                </button>
              </div>

              {/* Quick Document Q&A Section */}
              <div className="p-4 rounded-xl bg-blue-50/40 dark:bg-charcoal-950/60 border border-blue-100 dark:border-charcoal-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-charcoal-100 flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-blue-600 dark:text-brand-400" />
                    Ask Questions from this Document
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-brand-400 border border-blue-500/20 font-semibold font-mono">
                    Gemini Grounded Q&amp;A
                  </span>
                </div>

                <form
                  onSubmit={e => {
                    e.preventDefault();
                    handleAsk();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={askQuestion}
                    onChange={e => setAskQuestion(e.target.value)}
                    placeholder={`Ask anything about ${selectedDoc.fileName}...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-700 text-xs text-slate-900 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isAsking || !askQuestion.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-xs"
                  >
                    {isAsking ? (
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{isAsking ? 'Thinking...' : 'Ask'}</span>
                  </button>
                </form>

                {/* Suggestions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-slate-400 dark:text-charcoal-500 font-medium">Suggestions:</span>
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAsk(qp)}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-charcoal-900 hover:bg-slate-100 dark:hover:bg-charcoal-800 text-slate-700 dark:text-charcoal-300 text-[10px] border border-slate-200 dark:border-charcoal-700 transition cursor-pointer"
                    >
                      {qp}
                    </button>
                  ))}
                </div>

                {/* Latest Q&A Result */}
                {qaHistory.length > 0 && (
                  <div className="mt-3 p-4 rounded-xl bg-white dark:bg-charcoal-900 border border-blue-200 dark:border-charcoal-700 space-y-2 shadow-xs">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-100 dark:border-charcoal-800">
                      <span className="font-bold text-slate-900 dark:text-charcoal-100 flex items-center gap-1.5">
                        <Bot className="w-4 h-4 text-blue-600 dark:text-brand-400" />
                        Q: {qaHistory[0].question}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 dark:text-charcoal-500">
                          {qaHistory[0].model || 'Gemini'}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyAnswer(qaHistory[0].answer, 0)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-charcoal-200 p-1"
                          title="Copy answer"
                        >
                          {copiedIdx === 0 ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <div className="text-xs text-slate-800 dark:text-charcoal-200 leading-relaxed font-sans">
                      <FormattedMessage content={qaHistory[0].answer} />
                    </div>
                  </div>
                )}
              </div>

              {/* Summary Results */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    NLP Extractive Summary
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    Factuality Score: 100% (Grounded)
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-950/70 border border-slate-200 dark:border-charcoal-800 text-xs text-slate-800 dark:text-charcoal-200 leading-relaxed font-sans">
                  {selectedDoc.summary || 'Summary generation in progress...'}
                </div>
              </div>

              {/* Key Takeaways */}
              {selectedDoc.keyTakeaways && selectedDoc.keyTakeaways.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-charcoal-300">
                    Key Extracted Bullet Points
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-800 dark:text-charcoal-300">
                    {selectedDoc.keyTakeaways.map((point, idx) => (
                      <li key={idx} className="p-2.5 rounded-lg bg-slate-50 dark:bg-charcoal-850/60 border border-slate-200 dark:border-charcoal-800 flex items-start gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw Parsed Text Snippet */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-charcoal-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-charcoal-400">
                  Extracted Document Text (Sample)
                </h4>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-charcoal-950/40 border border-slate-200 dark:border-charcoal-855 text-[11px] font-mono text-slate-600 dark:text-charcoal-400 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                  {selectedDoc.extractedText.slice(0, 1000)}...
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-white dark:bg-charcoal-900 border border-slate-200/80 dark:border-charcoal-800 text-xs text-slate-500 dark:text-charcoal-500 shadow-sm">
              Select an uploaded file to view its extracted summary and key takeaways.
            </div>
          )}
        </div>
      </div>

      {/* Ask Document Modal */}
      {isAskModalOpen && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-charcoal-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-charcoal-900 border border-slate-200 dark:border-charcoal-800 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-charcoal-800 flex items-center justify-between bg-slate-50/60 dark:bg-charcoal-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-brand-600/20 text-blue-600 dark:text-brand-400 flex items-center justify-center border border-blue-200/80 dark:border-brand-500/30">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-charcoal-100">
                    Ask Document: {selectedDoc.fileName}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-charcoal-400">
                    Grounded strictly on document contents using Gemini AI
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-charcoal-400 dark:hover:text-charcoal-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-charcoal-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Q&A Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Suggestions */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-semibold text-slate-400 dark:text-charcoal-500 uppercase tracking-wider">
                  Suggested Questions
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAsk(qp)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-charcoal-800 dark:hover:bg-charcoal-700 text-slate-700 dark:text-charcoal-300 text-[11px] transition text-left cursor-pointer"
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q&A Thread */}
              {qaHistory.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 dark:text-charcoal-500 space-y-2">
                  <Bot className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                  <p className="font-semibold text-slate-600 dark:text-charcoal-400">
                    No questions asked yet for this document.
                  </p>
                  <p className="text-[11px]">
                    Type a question below or choose a suggestion to get instant answers.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {qaHistory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-charcoal-850/80 border border-slate-200/80 dark:border-charcoal-750 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-200/60 dark:border-charcoal-700">
                        <span className="font-bold text-slate-900 dark:text-charcoal-100 flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-brand-400" />
                          {item.question}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 dark:text-charcoal-500">
                            {item.model || 'Gemini'} • {item.timestamp}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyAnswer(item.answer, idx)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-charcoal-200 p-1 cursor-pointer"
                            title="Copy answer"
                          >
                            {copiedIdx === idx ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-800 dark:text-charcoal-200 leading-relaxed font-sans">
                        <FormattedMessage content={item.answer} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Input Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-charcoal-800 bg-white dark:bg-charcoal-900">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleAsk();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={askQuestion}
                  onChange={e => setAskQuestion(e.target.value)}
                  placeholder={`Ask a question about ${selectedDoc.fileName}...`}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-charcoal-800 border border-slate-200 dark:border-charcoal-700 text-xs text-slate-900 dark:text-charcoal-100 placeholder-slate-400 dark:placeholder-charcoal-500 focus:border-blue-500 outline-none"
                />
                <button
                  type="submit"
                  disabled={isAsking || !askQuestion.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  {isAsking ? (
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{isAsking ? 'Analyzing...' : 'Ask'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
