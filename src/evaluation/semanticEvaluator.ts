import { GoogleGenerativeAI } from '@google/generative-ai';

export class SemanticEvaluator {
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || null;
    if (apiKey && typeof apiKey === 'string' && apiKey.startsWith('AIzaSy')) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Compute semantic correctness score (0.0 to 1.0) using dense vector embedding similarity.
   */
  public async computeSemanticCorrectness(candidate: string, reference: string): Promise<number> {
    if (this.genAI) {
      try {
        const model = this.genAI.getGenerativeModel({ model: 'embedding-001' });
        const embedPromise = Promise.all([
          model.embedContent(candidate),
          model.embedContent(reference)
        ]);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Embedding timeout')), 1500)
        );
        const [resA, resB] = (await Promise.race([embedPromise, timeoutPromise])) as any;
        const vecA = resA.embedding.values;
        const vecB = resB.embedding.values;
        const cosine = this.vectorCosine(vecA, vecB);
        return Math.min(1.0, Math.max(0, Number(cosine.toFixed(3))));
      } catch (err) {
        // Fallback to local term vector similarity immediately
      }
    }
    return this.computeTermSimilarity(candidate, reference);
  }

  private computeTermSimilarity(textA: string, textB: string): number {
    const tokensA = this.tokenize(textA);
    const tokensB = this.tokenize(textB);

    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (const count of tokensA.values()) normA += count * count;
    for (const count of tokensB.values()) normB += count * count;

    if (normA === 0 || normB === 0) return 0;

    for (const [token, countA] of tokensA.entries()) {
      if (tokensB.has(token)) {
        dot += countA * tokensB.get(token)!;
      }
    }

    const cosine = dot / (Math.sqrt(normA) * Math.sqrt(normB));
    return Math.min(1.0, Math.max(0, Number(cosine.toFixed(3))));
  }

  private tokenize(text: string): Map<string, number> {
    const map = new Map<string, number>();
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(w => w.length > 2);
    for (const w of words) map.set(w, (map.get(w) || 0) + 1);
    return map;
  }

  private vectorCosine(vecA: number[], vecB: number[]): number {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
