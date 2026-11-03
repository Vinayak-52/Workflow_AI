/**
 * Document Upload and Summarization REST APIs
 * Member 2: Ankit Kumar Kunwar (2360031) & Member 1: Ayantik Goswami
 * Week 5 Milestone: Build document-upload API and storage integration
 */

import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/store.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.js';
import { activityLogger } from '../middleware/activityLogger.js';
import { MLClient } from '../services/mlClient.js';
import { askDocumentWithGemini } from '../services/geminiService.js';
import { DocumentRecord } from '../models/types.js';
import { extractDocumentText, isBinaryGarbage } from '../services/documentExtractor.js';
import { generateDocumentSummary } from '../services/nlpSummarizer.js';

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `doc-${Date.now()}-${uuidv4().slice(0, 6)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    const allowed = ['.txt', '.md', '.markdown', '.pdf', '.docx', '.json'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext) || file.mimetype.includes('text') || file.mimetype.includes('pdf')) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported. Use PDF, DOCX, TXT, or MD.`));
    }
  }
});

const router = Router();
router.use(authMiddleware);

// List User Documents
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const docs = db.getDocumentsByUserId(req.user!.id);
  docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return res.json({ documents: docs, count: docs.length });
});

// Upload Document
router.post('/upload', upload.single('file'), activityLogger('document', 'DOCUMENT_UPLOADED'), async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { code: 'FILE_REQUIRED', message: 'No file uploaded' } });
    }

    const filePath = req.file.path;
    const extractedText = await extractDocumentText(filePath, req.file.originalname);
    const summaryResult = await generateDocumentSummary(req.file.originalname, extractedText, 5);

    const docRecord: DocumentRecord = {
      id: `doc-${uuidv4().slice(0, 8)}`,
      userId: req.user!.id,
      fileName: req.file.originalname,
      filePath,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      extractedText: extractedText.slice(0, 50000), // Cap at 50k chars for safety
      summary: summaryResult.summary,
      keyTakeaways: summaryResult.key_takeaways,
      factualityScore: summaryResult.factuality_score,
      createdAt: new Date().toISOString()
    };

    db.saveDocument(docRecord);

    return res.status(201).json({
      document: docRecord,
      actionItems: summaryResult.action_items || []
    });
  } catch (err) {
    next(err);
  }
});

// Get Document by ID
router.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const doc = db.getDocumentById(req.params.id, req.user!.id);
  if (!doc) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
  }
  return res.json({ document: doc });
});

// Run Deep Summarization on Document
router.post('/:id/summarize', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    if (isBinaryGarbage(doc.extractedText) && fs.existsSync(doc.filePath)) {
      doc.extractedText = await extractDocumentText(doc.filePath, doc.fileName);
    }
    const { maxSentences = 5 } = req.body;
    const summaryResult = await generateDocumentSummary(doc.fileName, doc.extractedText, maxSentences);

    doc.summary = summaryResult.summary;
    doc.keyTakeaways = summaryResult.key_takeaways;
    doc.factualityScore = summaryResult.factuality_score;
    db.saveDocument(doc);

    return res.json({
      documentId: doc.id,
      fileName: doc.fileName,
      summary: summaryResult.summary,
      keyTakeaways: summaryResult.key_takeaways,
      actionItems: summaryResult.action_items,
      factualityScore: summaryResult.factuality_score,
      compressionRatio: summaryResult.compression_ratio
    });
  } catch (err) {
    next(err);
  }
});

// Ask Question about Document (Grounded Gemini QA)
router.post('/:id/ask', async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const doc = db.getDocumentById(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
    }

    const { question } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Question string is required' } });
    }

    if (isBinaryGarbage(doc.extractedText) && fs.existsSync(doc.filePath)) {
      doc.extractedText = await extractDocumentText(doc.filePath, doc.fileName);
      db.saveDocument(doc);
    }

    const result = await askDocumentWithGemini(doc.fileName, doc.extractedText, question.trim());

    return res.json({
      documentId: doc.id,
      fileName: doc.fileName,
      question: question.trim(),
      answer: result.answer,
      model: result.model
    });
  } catch (err) {
    next(err);
  }
});

// Delete Document
router.delete('/:id', activityLogger('document', 'DOCUMENT_DELETED'), (req: AuthenticatedRequest, res: Response) => {
  const doc = db.getDocumentById(req.params.id, req.user!.id);
  if (!doc) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Document not found' } });
  }
  if (fs.existsSync(doc.filePath)) {
    try { fs.unlinkSync(doc.filePath); } catch (e) { /* ignore */ }
  }
  db.deleteDocument(req.params.id, req.user!.id);
  return res.json({ success: true, message: 'Document removed' });
});

export default router;
