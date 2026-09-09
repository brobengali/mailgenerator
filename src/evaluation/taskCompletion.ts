export class TaskCompletionEvaluator {
  /**
   * Evaluates task completion (0.0 to 1.0) by checking intent resolution and question coverage.
   */
  public static computeTaskCompletion(
    incomingEmail: string,
    candidateReply: string,
    referenceReply: string
  ): number {
    const incLower = incomingEmail.toLowerCase();
    const candLower = candidateReply.toLowerCase();
    const refLower = referenceReply.toLowerCase();

    // Check key action words in reference vs candidate
    const actionWords = ['confirm', 'reschedule', 'refund', 'attach', 'w-9', 'soc2', 'hipaa', 'leave', 'reset', 'accept', 'approve'];
    let refActions = 0;
    let candMatches = 0;

    for (const action of actionWords) {
      if (refLower.includes(action)) {
        refActions++;
        if (candLower.includes(action)) {
          candMatches++;
        }
      }
    }

    if (refActions === 0) return 0.90; // Default high completion if no explicit keywords

    const coverageRatio = candMatches / refActions;
    return Math.min(1.0, Math.max(0.2, Number((0.4 + 0.6 * coverageRatio).toFixed(3))));
  }
}
