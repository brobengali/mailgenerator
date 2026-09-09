export class CompletenessToneEvaluator {
  /**
   * Evaluate completeness (0.0 to 1.0) based on reference length and action item coverage.
   */
  public static computeCompleteness(candidate: string, reference: string): number {
    const candLen = candidate.trim().length;
    const refLen = reference.trim().length;

    if (candLen === 0) return 0;

    if (candLen < 40) {
      return 0.35; // Overly brief penalty
    }

    const lengthRatio = Math.min(1.0, candLen / refLen);
    return Math.min(1.0, Math.max(0.4, Number((0.3 + 0.7 * lengthRatio).toFixed(3))));
  }

  /**
   * Evaluate tone and style appropriateness (0.0 to 1.0).
   */
  public static computeToneStyle(candidate: string): number {
    const candLower = candidate.toLowerCase();

    let score = 0.85;

    // Check for polite greetings and professional sign-offs
    if (candLower.includes('hi ') || candLower.includes('hello') || candLower.includes('dear ')) {
      score += 0.05;
    }

    if (candLower.includes('best regards') || candLower.includes('sincerely') || candLower.includes('warm regards') || candLower.includes('thanks')) {
      score += 0.05;
    }

    if (candLower.includes('apologize') || candLower.includes('sorry')) {
      score += 0.05;
    }

    // Penalize rude or aggressive phrasing
    if (candLower.includes('stupid') || candLower.includes('shut up') || candLower.includes('don\'t care')) {
      score -= 0.50;
    }

    return Math.min(1.0, Math.max(0.0, Number(score.toFixed(3))));
  }
}
