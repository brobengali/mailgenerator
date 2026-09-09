import 'dotenv/config';
import { DatasetLoader } from '../src/data/datasetLoader';
import { RAGEngine } from '../src/generator/ragEngine';
import { MultiDimensionalEvaluator } from '../src/evaluation/evaluator';
import { PerResponseReport } from '../src/types/index';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log(' AI EMAIL SUGGESTED-RESPONSE & MULTI-DIMENSIONAL EVALUATION');
  console.log('================================================================\n');

  const trainSet = DatasetLoader.getTrainDataset();
  const testSet = DatasetLoader.getTestDataset();

  console.log(`[+] Loaded ${trainSet.length} historical email-reply pairs into RAG Index (Train Set).`);
  console.log(`[+] Loaded ${testSet.length} held-out evaluation test cases (ZERO LEAKAGE TEST SET).\n`);

  const ragEngine = new RAGEngine(trainSet);
  const evaluator = new MultiDimensionalEvaluator();

  const startTime = Date.now();
  const reports: PerResponseReport[] = [];

  console.log('Running System Evaluation across Held-Out Test Set...\n');

  for (let i = 0; i < testSet.length; i++) {
    const item = testSet[i];
    console.log(`[Test ${i + 1}/${testSet.length}] ID: ${item.id} | Category: ${item.category.toUpperCase()}`);
    console.log(` Subject: "${item.subject}"`);

    // 1. Generate reply via RAG
    const genResult = await ragEngine.generateSuggestedResponse(
      item.subject,
      item.incoming_email,
      { top_k: 2, enable_rag: true, tone_directive: 'professional' }
    );

    // 2. Multi-dimensional evaluation against reference reply
    const report = await evaluator.evaluateSingleReply(
      item.id,
      item.category,
      item.incoming_email,
      genResult.suggested_reply,
      item.reference_reply
    );

    reports.push(report);

    console.log(`    Suggested Reply (${genResult.model_used}):`);
    console.log(`    "${genResult.suggested_reply.split('\n')[0]}..."`);
    console.log(`    --> Overall Score: ${(report.overall_score * 100).toFixed(1)}% | Grade: [${report.quality_grade}] | Decision: ${report.decision.toUpperCase()}`);
    console.log(`    --> Dimensions: Sem=${(report.scores.semantic_correctness * 100).toFixed(0)}% | Task=${(report.scores.task_completion * 100).toFixed(0)}% | Facts=${(report.scores.key_fact_consistency * 100).toFixed(0)}% | Safety=${(report.scores.contradiction_safety * 100).toFixed(0)}% | Comp=${(report.scores.completeness * 100).toFixed(0)}% | Tone=${(report.scores.tone_style * 100).toFixed(0)}%`);
    if (report.safety_gated) {
      console.log(`    --> [WARNING] SAFETY GATE TRIGGERED: Score capped due to factual contradiction!`);
    }
    console.log('');
  }

  const totalTime = Date.now() - startTime;
  const summary = evaluator.summarizeSystemPerformance(reports, totalTime);

  console.log('================================================================');
  console.log(' OVERALL SYSTEM EVALUATION REPORT SUMMARY');
  console.log('================================================================');
  console.log(` Total Test Emails Evaluated: ${summary.total_evaluated}`);
  console.log(` Average System Score:       ${(summary.average_overall_score * 100).toFixed(1)}%`);
  console.log(` Pass Rate (Score >= 70%):   ${summary.pass_rate}%`);
  console.log(` Safety Gated Responses:     ${summary.safety_gated_count}`);
  console.log(` Total Execution Time:       ${(summary.evaluation_time_ms / 1000).toFixed(2)}s\n`);

  console.log('PER-DIMENSION SCORE AVERAGES:');
  console.log(` - Semantic Correctness (25%): ${(summary.per_dimension_averages.semantic_correctness * 100).toFixed(1)}%`);
  console.log(` - Task/Intent Completion (25%): ${(summary.per_dimension_averages.task_completion * 100).toFixed(1)}%`);
  console.log(` - Key-Fact Consistency (20%): ${(summary.per_dimension_averages.key_fact_consistency * 100).toFixed(1)}%`);
  console.log(` - Contradiction Safety (15%): ${(summary.per_dimension_averages.contradiction_safety * 100).toFixed(1)}%`);
  console.log(` - Completeness (10%):         ${(summary.per_dimension_averages.completeness * 100).toFixed(1)}%`);
  console.log(` - Tone & Style (5%):          ${(summary.per_dimension_averages.tone_style * 100).toFixed(1)}%\n`);

  console.log('GRADE DISTRIBUTION:');
  console.log(` A+: ${summary.grade_distribution['A+']} | A: ${summary.grade_distribution['A']} | B: ${summary.grade_distribution['B']} | C: ${summary.grade_distribution['C']} | D: ${summary.grade_distribution['D']} | F: ${summary.grade_distribution['F']}\n`);

  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Save JSON report
  const jsonPath = path.join(reportsDir, 'evaluation_results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));

  // Save CSV summary
  let csvContent = 'email_id,category,overall_score,quality_grade,decision,semantic,task,key_facts,safety,completeness,tone,safety_gated\n';
  for (const r of summary.per_response_reports) {
    csvContent += `${r.email_id},${r.category},${r.overall_score},${r.quality_grade},${r.decision},${r.scores.semantic_correctness},${r.scores.task_completion},${r.scores.key_fact_consistency},${r.scores.contradiction_safety},${r.scores.completeness},${r.scores.tone_style},${r.safety_gated}\n`;
  }
  const csvPath = path.join(reportsDir, 'evaluation_summary.csv');
  fs.writeFileSync(csvPath, csvContent);

  console.log(`[+] Full JSON Evaluation Report saved to: ${jsonPath}`);
  console.log(`[+] CSV Summary Report saved to:        ${csvPath}`);
}

main().catch(err => {
  console.error('Evaluation run failed:', err);
  process.exit(1);
});
