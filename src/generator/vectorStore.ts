import { EmailRecord, RetrievedExample } from '../types/index';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class VectorStore {
  private records: EmailRecord[];
  private apiKey: string | null;
  private genAI: GoogleGenerativeAI | null = null;

  constructor(records: EmailRecord[]) {
    this.records = records;
    this.apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private tokenize(text: string): Map<string, number> {
    const map = new Map<string, number>();
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2);

    for (const w of words) {
      map.set(w, (map.get(w) || 0) + 1);
    }
    return map;
  }

  private computeCosineSimilarity(mapA: Map<string, number>, mapB: Map<string, number>): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const val of mapA.values()) normA += val * val;
    for (const val of mapB.values()) normB += val * val;

    if (normA === 0 || normB === 0) return 0;

    for (const [key, valA] of mapA.entries()) {
      if (mapB.has(key)) {
        dotProduct += valA * mapB.get(key)!;
      }
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  public async retrieveTopK(
    querySubject: string,
    queryBody: string,
    topK: number = 3
  ): Promise<RetrievedExample[]> {
    const fullQueryText = `${querySubject}\n${queryBody}`;
    const queryTokens = this.tokenize(fullQueryText);

    const scored: RetrievedExample[] = this.records.map(record => {
      const intentText = record.metadata?.intent || '';
      const docText = `${record.subject}\n${record.incoming_email}\n${intentText}`;
      const docTokens = this.tokenize(docText);
      
      let baseScore = this.computeCosineSimilarity(queryTokens, docTokens);

      if (querySubject && record.category && querySubject.toLowerCase().includes(record.category.replace('_', ' '))) {
        baseScore += 0.15;
      }

      return {
        record,
        similarity_score: Math.min(1.0, baseScore)
      };
    });

    scored.sort((a, b) => b.similarity_score - a.similarity_score);
    return scored.slice(0, topK);
  }

  private vectorCosine(vecA: number[], vecB: number[]): number {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
