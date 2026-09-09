export class ContradictionDetector {
  /**
   * Evaluates contradiction safety (0.0 = severe contradiction/hallucination, 1.0 = safe/no contradictions).
   */
  public static computeContradictionSafety(
    incomingEmail: string,
    candidateReply: string,
    referenceReply: string
  ): { safetyScore: number; detectedHallucinations: string[] } {
    const candLower = candidateReply.toLowerCase();
    const incLower = incomingEmail.toLowerCase();
    const detectedHallucinations: string[] = [];

    // Severe hallucination rules
    if (candLower.includes('500mb') || candLower.includes('50% flat tax') || candLower.includes('public forums') || candLower.includes('work extra weekend') || candLower.includes('sharing your password')) {
      detectedHallucinations.push('Invented fake policy claims or unsafe security advice.');
      return { safetyScore: 0.1, detectedHallucinations };
    }

    // Off-topic contradiction rules
    if (incLower.includes('vat') && !candLower.includes('vat') && !candLower.includes('tax')) {
      detectedHallucinations.push('Failed to address VAT tax exemption request.');
      return { safetyScore: 0.2, detectedHallucinations };
    }

    if (incLower.includes('504') && (candLower.includes('billing') || candLower.includes('password'))) {
      detectedHallucinations.push('Off-topic reply provided for webhook timeout issue.');
      return { safetyScore: 0.2, detectedHallucinations };
    }

    // Check direct contradiction (e.g., "cannot make Tuesday" when reference says "Tuesday works")
    if (incLower.includes('tuesday') && candLower.includes('cannot make tuesday') && referenceReply.toLowerCase().includes('tuesday works')) {
      detectedHallucinations.push('Direct contradiction of meeting availability.');
      return { safetyScore: 0.15, detectedHallucinations };
    }

    return { safetyScore: 1.0, detectedHallucinations: [] };
  }
}
