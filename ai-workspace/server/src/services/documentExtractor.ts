/**
 * Resilient Document Text Extractor
 * Member 1: Ayantik Goswami & Member 2: Ankit Kumar Kunwar
 * Supports PDF, DOCX, TXT, MD, Markdown, JSON, CSV with zero external binary dependencies.
 */

import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { MLClient } from './mlClient.js';

export function isBinaryGarbage(text: string): boolean {
  if (!text || text.trim().length === 0) return true;
  const sample = text.slice(0, 1500);
  if (sample.startsWith('%PDF-') || sample.includes('endobj') || sample.includes('FlateDecode') || sample.includes('/Type /Catalog')) {
    return true;
  }
  if (sample.startsWith('PK\x03\x04') || sample.includes('[Content_Types].xml') || sample.includes('word/document.xml')) {
    return true;
  }
  let printable = 0;
  for (let i = 0; i < sample.length; i++) {
    const code = sample.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 10 || code === 13 || code === 9) {
      printable++;
    }
  }
  return (printable / sample.length) < 0.70;
}

/**
 * Extracts text from PDF files using zlib inflate stream analysis and CMap glyph decoding
 */
export function extractTextFromPdf(filePath: string): string {
  try {
    const buf = fs.readFileSync(filePath);
    let streams: string[] = [];
    let idx = 0;

    while ((idx = buf.indexOf('stream', idx)) !== -1) {
      let start = idx + 6;
      if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;
      else if (buf[start] === 0x0a || buf[start] === 0x0d) start += 1;
      const end = buf.indexOf('endstream', start);
      if (end === -1) break;

      const slice = buf.slice(start, end);
      try {
        const uncompressed = zlib.inflateSync(slice);
        streams.push(uncompressed.toString('latin1'));
      } catch {
        // Raw or uncompressed stream
        streams.push(slice.toString('latin1'));
      }
      idx = end + 9;
    }

    // Parse CMaps if present
    const cmap: Record<number, string> = {};
    for (const s of streams) {
      if (s.includes('begincmap')) {
        const bfcharBlock = s.match(/beginbfchar([\s\S]*?)endbfchar/);
        if (bfcharBlock) {
          const charMatches = bfcharBlock[1].matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g);
          for (const m of charMatches) {
            cmap[parseInt(m[1], 16)] = String.fromCharCode(parseInt(m[2], 16));
          }
        }
        const bfrangeBlock = s.match(/beginbfrange([\s\S]*?)endbfrange/);
        if (bfrangeBlock) {
          const rangeMatches = bfrangeBlock[1].matchAll(/<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>\s+<([0-9a-fA-F]+)>/g);
          for (const m of rangeMatches) {
            const startC = parseInt(m[1], 16);
            const endC = parseInt(m[2], 16);
            const destC = parseInt(m[3], 16);
            for (let c = startC; c <= endC; c++) {
              cmap[c] = String.fromCharCode(destC + (c - startC));
            }
          }
        }
      }
    }

    let allText = '';
    const hasCmap = Object.keys(cmap).length > 0;

    for (const s of streams) {
      let streamText = '';

      if (hasCmap && (s.includes('Tj') || s.includes('TJ'))) {
        // Hex decoded CMap text
        const hexTj = /<([0-9a-fA-F]+)>\s*Tj/g;
        let m: RegExpExecArray | null;
        while ((m = hexTj.exec(s)) !== null) {
          const hex = m[1];
          for (let i = 0; i < hex.length; i += 4) {
            const code = parseInt(hex.slice(i, i + 4), 16);
            streamText += cmap[code] || '';
          }
        }
      }

      // Standard bracketed kerning TJ: [(text)-10(more)] TJ
      const tjRegex = /\[(.*?)\]\s*TJ/gs;
      let tjMatch: RegExpExecArray | null;
      while ((tjMatch = tjRegex.exec(s)) !== null) {
        const inner = tjMatch[1];
        const tokenRegex = /\((.*?)\)|(-?\d+(?:\.\d+)?)/g;
        let tMatch: RegExpExecArray | null;
        let line = '';
        while ((tMatch = tokenRegex.exec(inner)) !== null) {
          if (tMatch[1] !== undefined) {
            line += tMatch[1];
          } else if (tMatch[2] !== undefined) {
            const num = parseFloat(tMatch[2]);
            if (num <= -250) {
              line += ' ';
            }
          }
        }
        if (line.trim()) {
          streamText += line.trim() + ' ';
        }
      }

      // Standard single Tj: (text) Tj
      const singleTjRegex = /\((.*?)\)\s*Tj/g;
      let singleMatch: RegExpExecArray | null;
      while ((singleMatch = singleTjRegex.exec(s)) !== null) {
        streamText += singleMatch[1] + ' ';
      }

      if (streamText.trim()) {
        allText += streamText.trim() + '\n';
      }
    }

    // Clean up escaping and whitespace
    let cleaned = allText
      .replace(/\\([()\\])/g, '$1')
      .replace(/\\r/g, ' ')
      .replace(/\\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    return isBinaryGarbage(cleaned) ? '' : cleaned;
  } catch (err) {
    console.warn('[DocumentExtractor] PDF extraction error:', err);
    return '';
  }
}

/**
 * Extracts text from DOCX files by reading word/document.xml from the ZIP structure
 */
export function extractTextFromDocx(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath);
    let pos = 0;
    while (pos < buffer.length - 30) {
      if (buffer[pos] === 0x50 && buffer[pos + 1] === 0x4b && buffer[pos + 2] === 0x03 && buffer[pos + 3] === 0x04) {
        const compMethod = buffer.readUInt16LE(pos + 8);
        const compSize = buffer.readUInt32LE(pos + 18);
        const nameLen = buffer.readUInt16LE(pos + 26);
        const extraLen = buffer.readUInt16LE(pos + 28);
        const name = buffer.slice(pos + 30, pos + 30 + nameLen).toString('utf8');
        const dataStart = pos + 30 + nameLen + extraLen;
        const dataEnd = dataStart + compSize;

        if (name === 'word/document.xml') {
          const compData = buffer.slice(dataStart, dataEnd);
          let xml = '';
          if (compMethod === 8) {
            xml = zlib.inflateRawSync(compData).toString('utf8');
          } else if (compMethod === 0) {
            xml = compData.toString('utf8');
          }
          const textParts: string[] = [];
          const regex = /<w:t(?:[^>]*)>([\s\S]*?)<\/w:t>/g;
          let m: RegExpExecArray | null;
          while ((m = regex.exec(xml)) !== null) {
            textParts.push(m[1]);
          }
          const result = textParts.join(' ').replace(/\s+/g, ' ').trim();
          return isBinaryGarbage(result) ? '' : result;
        }
        pos = dataEnd;
      } else {
        pos++;
      }
    }
  } catch (err) {
    console.warn('[DocumentExtractor] DOCX extraction error:', err);
  }
  return '';
}

/**
 * Universal Document Text Extraction Pipeline
 */
export async function extractDocumentText(filePath: string, originalName: string): Promise<string> {
  const ext = path.extname(originalName || filePath).toLowerCase();

  // 1. Plain text formats
  if (['.txt', '.md', '.markdown', '.json', '.csv', '.rtf'].includes(ext)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      if (!isBinaryGarbage(raw)) return raw.trim();
    } catch {
      // Continue to ML client
    }
  }

  // 2. Try Python microservice first if active
  try {
    const mlExtracted = await MLClient.extractText(filePath);
    if (mlExtracted && mlExtracted.trim().length > 15 && !isBinaryGarbage(mlExtracted)) {
      return mlExtracted.trim();
    }
  } catch {
    // Fall back to built-in extractors
  }

  // 3. Built-in Format-Specific Extractors
  if (ext === '.pdf') {
    const pdfText = extractTextFromPdf(filePath);
    if (pdfText && pdfText.length > 20) return pdfText;
  } else if (ext === '.docx' || ext === '.doc') {
    const docxText = extractTextFromDocx(filePath);
    if (docxText && docxText.length > 20) return docxText;
  }

  // 4. Safe fallback: Read raw file ONLY if text-based and non-binary
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    if (!isBinaryGarbage(raw) && raw.trim().length > 10) {
      return raw.trim();
    }
  } catch {
    // Non-decodable
  }

  return `Document: ${originalName} (Binary content; structured text extraction unavailable).`;
}
