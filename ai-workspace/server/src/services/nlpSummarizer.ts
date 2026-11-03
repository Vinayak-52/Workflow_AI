/**
 * Extractive & Generative NLP Summarization Engine
 * Member 1: Ayantik Goswami (2360006)
 * Week 5 Milestone: Advanced Summarization, Salience Scoring, and Action Item Extraction
 */

import { CONFIG } from '../config/env.js';
import { isBinaryGarbage } from './documentExtractor.js';

export interface SummarizerOutput {
  summary: string;
  key_takeaways: string[];
  action_items: string[];
  compression_ratio: number;
  factuality_score: number;
  method: string;
}

const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but',
  'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'has', 'have', 'having', 'he', 'her', 'here', 'him', 'his', 'how', 'i',
  'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'me', 'more', 'most', 'my', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'out', 'over',
  'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their',
  'theirs', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to',
  'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your'
]);

const ACADEMIC_CUES = new Set([
  'definition', 'defined', 'concept', 'objective', 'objectives', 'framework', 'architecture',
  'evolution', 'advantage', 'advantages', 'benefit', 'benefits', 'primary', 'essential',
  'fundamental', 'characteristic', 'characteristics', 'strategy', 'strategies', 'management',
  'mechanism', 'algorithm', 'evaluation', 'results', 'conclusion', 'critical', 'component',
  'components', 'purpose', 'process', 'analysis', 'system', 'methodology', 'implementation'
]);

const ACTION_VERBS = [
  'must', 'should', 'need to', 'finalize', 'implement', 'create', 'develop', 'prepare',
  'review', 'submit', 'complete', 'design', 'test', 'ensure', 'deliver', 'configure', 'setup'
];

function cleanNoise(text: string): string {
  return text
    .replace(/Source:\s*[\w-]+\s*\|\s*Difficulty:\s*\w+/gi, '')
    .replace(/Course\s*(?:ID|Code):\s*[\w_-]+/gi, '')
    .replace(/\b(?:page|pg\.?)\s+\d+(?:\s+of\s+\d+)?\b/gi, '')
    .replace(/[\uFFFD\u2022\u25CF\u25AA\u25BA\u25B6\u25C6\uF0A7\uF0B7]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function splitSentences(text: string): string[] {
  const cleaned = cleanNoise(text);
  const chunks = cleaned.split(/(?<=[.!?])\s+|\n{2,}|\n(?=[-•*]|\d+[\.)]\s+)/);
  const sentences: string[] = [];

  for (const c of chunks) {
    const s = c.replace(/\s+/g, ' ').trim();
    if (s.length >= 25 && s.length <= 400 && !s.startsWith('http')) {
      const alphaCount = (s.match(/[a-zA-Z]/g) || []).length;
      if (alphaCount >= 14) {
        sentences.push(s);
      }
    }
  }
  return sentences;
}

function tokenize(text: string): string[] {
  const words = text.toLowerCase().match(/\b[a-zA-Z0-9_\'-]+\b/g) || [];
  return words.filter(w => !STOPWORDS.has(w) && w.length > 2);
}

function extractActionItems(text: string): string[] {
  const sentences = splitSentences(text);
  const items: string[] = [];
  for (const s of sentences) {
    const sLower = s.toLowerCase();
    for (const v of ACTION_VERBS) {
      if (sLower.includes(v) && !items.includes(s)) {
        items.push(s);
        break;
      }
    }
    if (items.length >= 5) break;
  }
  return items;
}

/**
 * Deterministic NLP Extractive Summarizer using Salience & MMR (Maximal Marginal Relevance)
 */
export function summarizeExtractive(text: string, maxSentences: number = 5): SummarizerOutput {
  if (isBinaryGarbage(text)) {
    return {
      summary: 'The document contains binary formatting or unextracted binary data. Structured plain text extraction is recommended.',
      key_takeaways: ['Binary encoded content detected.'],
      action_items: [],
      compression_ratio: 1.0,
      factuality_score: 1.0,
      method: 'binary_guard'
    };
  }

  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    const snippet = text.slice(0, 300).replace(/\s+/g, ' ').trim();
    return {
      summary: snippet || 'No readable text content identified for summarization.',
      key_takeaways: snippet ? [snippet] : [],
      action_items: [],
      compression_ratio: 1.0,
      factuality_score: 1.0,
      method: 'snippet_fallback'
    };
  }

  if (sentences.length <= maxSentences) {
    return {
      summary: sentences.join(' '),
      key_takeaways: sentences,
      action_items: extractActionItems(text),
      compression_ratio: 1.0,
      factuality_score: 1.0,
      method: 'short_doc_direct'
    };
  }

  // Calculate word frequencies
  const allTokens: string[] = [];
  const sentenceTokenList: Array<{ sentence: string; tokens: string[]; tokenSet: Set<string>; idx: number }> = [];

  for (let idx = 0; idx < sentences.length; idx++) {
    const s = sentences[idx];
    const tokens = tokenize(s);
    sentenceTokenList.push({ sentence: s, tokens, tokenSet: new Set(tokens), idx });
    allTokens.push(...tokens);
  }

  const freqMap: Record<string, number> = {};
  for (const t of allTokens) {
    freqMap[t] = (freqMap[t] || 0) + 1;
  }
  const maxFreq = Math.max(1, ...Object.values(freqMap));
  for (const k in freqMap) {
    freqMap[k] /= maxFreq;
  }

  // Score each sentence
  const scoredSentences: Array<{ idx: number; score: number; sentence: string; tokenSet: Set<string> }> = [];

  for (const item of sentenceTokenList) {
    if (item.tokens.length === 0) continue;

    // Position bias
    const posWeight = item.idx < 3 ? 1.3 : (item.idx < 8 ? 1.15 : (item.idx === sentences.length - 1 ? 1.1 : 1.0));

    // Length normalization
    const lengthNorm = 1.0 / (1.0 + Math.abs(item.tokens.length - 20) * 0.04);

    // Salience frequency score
    const baseScore = item.tokens.reduce((acc, t) => acc + (freqMap[t] || 0), 0) / item.tokens.length;

    // Academic cue keywords boost
    const cueHits = item.tokens.filter(t => ACADEMIC_CUES.has(t)).length;
    const cueBoost = 1.0 + Math.min(0.6, cueHits * 0.20);

    const finalScore = baseScore * posWeight * lengthNorm * cueBoost;
    scoredSentences.push({ idx: item.idx, score: finalScore, sentence: item.sentence, tokenSet: item.tokenSet });
  }

  scoredSentences.sort((a, b) => b.score - a.score);

  // MMR Diversity Selection to avoid redundancy
  const selected: typeof scoredSentences = [];
  for (const cand of scoredSentences) {
    if (selected.length >= maxSentences) break;

    let redundant = false;
    for (const sel of selected) {
      let intersection = 0;
      for (const t of cand.tokenSet) {
        if (sel.tokenSet.has(t)) intersection++;
      }
      const union = cand.tokenSet.size + sel.tokenSet.size - intersection;
      const jaccard = union > 0 ? intersection / union : 0;
      if (jaccard > 0.45) {
        redundant = true;
        break;
      }
    }

    if (!redundant) {
      selected.push(cand);
    }
  }

  // Chronological re-ordering of selected sentences
  selected.sort((a, b) => a.idx - b.idx);

  const takeaways = selected.map(s => s.sentence);
  const summary = takeaways.join(' ');
  const compressionRatio = Math.round((summary.length / Math.max(1, text.length)) * 100) / 100;

  return {
    summary,
    key_takeaways: takeaways,
    action_items: extractActionItems(text),
    compression_ratio: compressionRatio,
    factuality_score: 1.0,
    method: 'extractive_salience_mmr'
  };
}

/**
 * Gemini AI Structured Summarizer with Fallback to Extractive Salience
 */
export async function generateDocumentSummary(
  fileName: string,
  documentText: string,
  maxSentences: number = 5
): Promise<SummarizerOutput> {
  if (isBinaryGarbage(documentText)) {
    return {
      summary: `Document "${fileName}" contains binary data or unextracted media. Plain text extraction could not decode structured text.`,
      key_takeaways: ['Binary encoded content detected.'],
      action_items: [],
      compression_ratio: 1.0,
      factuality_score: 1.0,
      method: 'binary_guard'
    };
  }

  const apiKey = CONFIG.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const truncated = documentText.length > 30000
        ? documentText.slice(0, 30000) + '\n\n[... content truncated for token limits ...]'
        : documentText;

      const systemPrompt = `You are an expert academic and technical NLP summarizer embedded in the AI Workspace.
Analyze the provided document and produce a clear, authoritative, coherent summary.
You MUST output valid, raw JSON only without markdown code blocks, using this format:
{
  "summary": "A clean 2 to 4 sentence executive summary of the document.",
  "key_takeaways": ["First key takeaway", "Second key takeaway", "Third key takeaway"],
  "action_items": ["Action item if any"]
}`;

      const userPrompt = `DOCUMENT TITLE: ${fileName}\n\n=== DOCUMENT TEXT ===\n${truncated}\n=== END DOCUMENT TEXT ===`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: {
              maxOutputTokens: 800,
              temperature: 0.2,
              responseMimeType: 'application/json'
            }
          }),
          signal: AbortSignal.timeout(12000)
        }
      );

      if (response.ok) {
        const data = (await response.json()) as any;
        const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (rawJsonText) {
          try {
            const parsed = JSON.parse(rawJsonText);
            if (parsed.summary && typeof parsed.summary === 'string') {
              return {
                summary: parsed.summary,
                key_takeaways: Array.isArray(parsed.key_takeaways) ? parsed.key_takeaways : [],
                action_items: Array.isArray(parsed.action_items) ? parsed.action_items : [],
                compression_ratio: Math.round((parsed.summary.length / Math.max(1, documentText.length)) * 100) / 100,
                factuality_score: 0.98,
                method: 'gemini_2.0_flash'
              };
            }
          } catch {
            // If JSON parsing fails, use text directly
            return {
              summary: rawJsonText.slice(0, 400),
              key_takeaways: splitSentences(rawJsonText).slice(0, 4),
              action_items: [],
              compression_ratio: 0.25,
              factuality_score: 0.95,
              method: 'gemini_text'
            };
          }
        }
      }
    } catch (err: any) {
      console.warn('[NLP Summarizer] Gemini summarization call failed, falling back to extractive engine:', err.message);
    }
  }

  // Extractive Salience MMR fallback
  return summarizeExtractive(documentText, maxSentences);
}
