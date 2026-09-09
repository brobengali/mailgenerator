import { PerResponseReport, AggregateSystemReport, EvaluationScores, EmailCategory } from '../types/index';
import { SemanticEvaluator } from './semanticEvaluator';
import { TaskCompletionEvaluator } from './taskCompletion';
import { KeyFactConsistencyEvaluator } from './factExtractor';
import { ContradictionDetector } from './contradictionDetector';
import { CompletenessToneEvaluator } from './completenessTone';

export class MultiDimensionalEvaluator {
  private semanticEval: SemanticEvaluator;

  constructor() {
    this.semanticEval = new SemanticEvaluator();
  }

  /**
   * Evaluate a single generated email reply against incoming email and reference reply.
   */
  public async evaluateSingleReply(
    emailId: string,
    category: EmailCategory,
    incomingEmail: string,
    generatedReply: string,
    referenceReply: string
  ): Promise<PerResponseReport> {
    // 1. Semantic Correctness (25%)
    const semanticCorrectness = await this.semanticEval.computeSemanticCorrectness(generatedReply, referenceReply);

    // 2. Task / Intent Completion (25%)
    const taskCompletion = TaskCompletionEvaluator.computeTaskCompletion(incomingEmail, generatedReply, referenceReply);

    // 3. Key-Fact Consistency (20%)
    const keyFactConsistency = KeyFactConsistencyEvaluator.computeKeyFactConsistency(generatedReply, referenceReply);

    // 4. Contradiction & Hallucination Safety (15%)
    const contradictionRes = ContradictionDetector.computeContradictionSafety(incomingEmail, generatedReply, referenceReply);
    const contradictionSafety = contradictionRes.safetyScore;

    // 5. Completeness (10%)
    const completeness = CompletenessToneEvaluator.computeCompleteness(generatedReply, referenceReply);

    // 6. Tone / Style (5%)
    const toneStyle = CompletenessToneEvaluator.computeToneStyle(generatedReply);

    const scores: EvaluationScores = {
      semantic_correctness: semanticCorrectness,
      task_completion: taskCompletion,
      key_fact_consistency: keyFactConsistency,
      contradiction_safety: contradictionSafety,
      completeness: completeness,
      tone_style: toneStyle,
    };

    // Calculate initial weighted score
    let calculatedScore = (
      0.25 * scores.semantic_correctness +
      0.25 * scores.task_completion +
      0.20 * scores.key_fact_consistency +
      0.15 * scores.contradiction_safety +
      0.10 * scores.completeness +
      0.05 * scores.tone_style
    );

    let safetyGated = false;
    const issues: string[] = [...contradictionRes.detectedHallucinations];
    const strengths: string[] = [];

    // CRITICAL SAFETY GATING RULE
    if (scores.contradiction_safety < 0.5) {
      calculatedScore = Math.min(calculatedScore, 0.45);
      safetyGated = true;
      issues.push('SAFETY GATE TRIGGERED: Response capped at 0.45 due to critical contradiction/hallucination.');
    }

    if (scores.key_fact_consistency < 0.5) {
      calculatedScore = Math.min(calculatedScore, 0.50);
      safetyGated = true;
      issues.push('SAFETY GATE TRIGGERED: Response capped at 0.50 due to key-fact alteration.');
    }

    const finalOverallScore = Number(calculatedScore.toFixed(3));

    // Assign Decision & Quality Grade
    let decision: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsafe' = 'poor';
    let qualityGrade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'F';

    if (safetyGated || finalOverallScore < 0.50) {
      decision = 'unsafe';
      qualityGrade = 'F';
    } else if (finalOverallScore >= 0.90) {
      decision = 'excellent';
      qualityGrade = 'A+';
      strengths.push('Outstanding intent resolution, factual accuracy, and tone alignment.');
    } else if (finalOverallScore >= 0.80) {
      decision = 'good';
      qualityGrade = 'A';
      strengths.push('High quality reply accurately addressing sender requests.');
    } else if (finalOverallScore >= 0.70) {
      decision = 'acceptable';
      qualityGrade = 'B';
      strengths.push('Acceptable response resolution.');
    } else if (finalOverallScore >= 0.60) {
      decision = 'poor';
      qualityGrade = 'C';
    }

    if (scores.task_completion >= 0.90) strengths.push('Preserved core task intent.');
    if (scores.key_fact_consistency >= 0.90) strengths.push('All key dates, numbers, and codes preserved.');
    if (scores.tone_style >= 0.90) strengths.push('Appropriate professional tone.');

    return {
      email_id: emailId,
      category,
      incoming_email: incomingEmail,
      reference_reply: referenceReply,
      generated_reply: generatedReply,
      scores,
      overall_score: finalOverallScore,
      safety_gated: safetyGated,
      quality_grade: qualityGrade,
      decision,
      strengths,
      issues,
      confidence: Number((0.85 + 0.15 * finalOverallScore).toFixed(2)),
    };
  }

  /**
   * Summarizes batch evaluation performance into system-wide report.
   */
  public summarizeSystemPerformance(
    reports: PerResponseReport[],
    totalExecutionTimeMs: number
  ): AggregateSystemReport {
    if (reports.length === 0) {
      return {
        total_evaluated: 0,
        average_overall_score: 0,
        pass_rate: 0,
        safety_gated_count: 0,
        per_dimension_averages: {
          semantic_correctness: 0,
          task_completion: 0,
          key_fact_consistency: 0,
          contradiction_safety: 0,
          completeness: 0,
          tone_style: 0,
        },
        grade_distribution: { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 },
        category_breakdown: {},
        evaluation_time_ms: totalExecutionTimeMs,
        per_response_reports: [],
      };
    }

    let sumOverall = 0;
    let passCount = 0;
    let gatedCount = 0;

    let sumSem = 0, sumTask = 0, sumFact = 0, sumSafe = 0, sumComp = 0, sumTone = 0;

    const categoryMap: Record<string, { count: number; sumScore: number }> = {};
    const gradeDist: Record<string, number> = { 'A+': 0, 'A': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };

    for (const r of reports) {
      sumOverall += r.overall_score;
      if (r.overall_score >= 0.70) passCount++;
      if (r.safety_gated) gatedCount++;

      sumSem += r.scores.semantic_correctness;
      sumTask += r.scores.task_completion;
      sumFact += r.scores.key_fact_consistency;
      sumSafe += r.scores.contradiction_safety;
      sumComp += r.scores.completeness;
      sumTone += r.scores.tone_style;

      if (!categoryMap[r.category]) {
        categoryMap[r.category] = { count: 0, sumScore: 0 };
      }
      categoryMap[r.category].count += 1;
      categoryMap[r.category].sumScore += r.overall_score;

      gradeDist[r.quality_grade] = (gradeDist[r.quality_grade] || 0) + 1;
    }

    const n = reports.length;
    const categoryBreakdown: Record<string, { count: number; avg_score: number }> = {};

    for (const [cat, data] of Object.entries(categoryMap)) {
      categoryBreakdown[cat] = {
        count: data.count,
        avg_score: Number((data.sumScore / data.count).toFixed(3)),
      };
    }

    return {
      total_evaluated: n,
      average_overall_score: Number((sumOverall / n).toFixed(3)),
      pass_rate: Math.round((passCount / n) * 100),
      safety_gated_count: gatedCount,
      per_dimension_averages: {
        semantic_correctness: Number((sumSem / n).toFixed(3)),
        task_completion: Number((sumTask / n).toFixed(3)),
        key_fact_consistency: Number((sumFact / n).toFixed(3)),
        contradiction_safety: Number((sumSafe / n).toFixed(3)),
        completeness: Number((sumComp / n).toFixed(3)),
        tone_style: Number((sumTone / n).toFixed(3)),
      },
      grade_distribution: gradeDist,
      category_breakdown: categoryBreakdown,
      evaluation_time_ms: totalExecutionTimeMs,
      per_response_reports: reports,
    };
  }
}
