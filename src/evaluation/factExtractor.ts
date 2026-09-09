export class KeyFactConsistencyEvaluator {
  /**
   * Extracts key factual entities (dates, times, dollar amounts, tracking numbers, codes).
   */
  public static extractFacts(text: string): {
    datesTimes: string[];
    numbersAmounts: string[];
    codes: string[];
  } {
    const textLower = text.toLowerCase();
    
    // Dates & Times regex (e.g., Tuesday, 2:00 PM, March 1st, Friday, 3 PM)
    const dateRegex = /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))\b/gi;
    const datesTimes = Array.from(textLower.matchAll(dateRegex)).map(m => m[0]);

    // Numbers & Dollar Amounts (e.g. $299, $1,250, 10,000, 2MB, 10s, 16 weeks, 500MB)
    const numberRegex = /(\$\d+(?:\,\d+)*(?:\.\d+)?|\b\d+(?:\,\d+)*\s*(?:mb|gb|req\/min|weeks|days|hours|min|s|%)\b)/gi;
    const numbersAmounts = Array.from(textLower.matchAll(numberRegex)).map(m => m[0]);

    // Ticket & Invoice Codes (e.g. #INV-88492, #ORD-9000, ws-99218)
    const codeRegex = /(#[a-z0-9\-]+|\bws-\d+\b|\binv-\d+\b|\bcn-\d+\b)/gi;
    const codes = Array.from(textLower.matchAll(codeRegex)).map(m => m[0]);

    return { datesTimes, numbersAmounts, codes };
  }

  /**
   * Evaluates key-fact consistency (0.0 to 1.0).
   * HEAVILY PENALIZES modified dates, times, or altered numbers!
   */
  public static computeKeyFactConsistency(candidate: string, reference: string): number {
    const refFacts = this.extractFacts(reference);
    const candFacts = this.extractFacts(candidate);

    let totalFacts = 0;
    let preservedFacts = 0;

    // Check code preservation (Invoice numbers, Ticket IDs)
    for (const code of refFacts.codes) {
      totalFacts++;
      if (candFacts.codes.includes(code)) preservedFacts++;
    }

    // Check dollar amounts and numeric specs
    for (const num of refFacts.numbersAmounts) {
      totalFacts++;
      if (candFacts.numbersAmounts.includes(num)) preservedFacts++;
    }

    // Check date preservation
    for (const dt of refFacts.datesTimes) {
      totalFacts++;
      if (candFacts.datesTimes.includes(dt)) preservedFacts++;
    }

    if (totalFacts === 0) return 0.95; // High default if no explicit numeric facts present

    const ratio = preservedFacts / totalFacts;
    return Math.min(1.0, Math.max(0.0, Number(ratio.toFixed(3))));
  }
}
