import 'dotenv/config';
import { AblationStudyRunner } from '../src/evaluation/ablationStudy.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log(' ABLATION STUDY: ZERO-SHOT VS RAG VS SAFETY GATING');
  console.log('================================================================\n');

  console.log('Comparing 3 architectural configurations across held-out test subset:');
  console.log('  Baseline A: LLM Zero-Shot without historical retrieval');
  console.log('  Baseline B: LLM Few-Shot RAG with historical retrieval');
  console.log('  Baseline C: LLM RAG + Structured Evaluation & Safety Gating\n');

  const runner = new AblationStudyRunner();
  const res = await runner.runAblationStudy();

  console.log('ABLATION EXPERIMENT RESULTS:');
  console.log('----------------------------------------------------------------------------------------------------');
  console.log('Configuration                         | Avg Overall Score | Pass Rate (>=70%) | Safety Gated Count');
  console.log('----------------------------------------------------------------------------------------------------');
  console.log(`Baseline A (Zero-Shot, No Retrieval)  |       ${(res.baseline_a_zero_shot.avg_score * 100).toFixed(1)}%       |       ${res.baseline_a_zero_shot.pass_rate}%        |       ${res.baseline_a_zero_shot.safety_gated_count}`);
  console.log(`Baseline B (Few-Shot RAG)             |       ${(res.baseline_b_rag.avg_score * 100).toFixed(1)}%       |       ${res.baseline_b_rag.pass_rate}%        |       ${res.baseline_b_rag.safety_gated_count}`);
  console.log(`Baseline C (RAG + Safety Gate)        |       ${(res.baseline_c_rag_safety.avg_score * 100).toFixed(1)}%       |       ${res.baseline_c_rag_safety.pass_rate}%        |       ${res.baseline_c_rag_safety.safety_gated_count}`);
  console.log('----------------------------------------------------------------------------------------------------\n');

  console.log(`[+] RAG Performance Lift (B over A):    +${res.lift_b_over_a_pct}% relative score improvement`);
  console.log(`[+] Safety Gate Impact (C over B):      ${res.lift_c_over_b_pct >= 0 ? '+' : ''}${res.lift_c_over_b_pct}% (Prevents ungrounded hallucination risk)\n`);

  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'ablation_results.json');
  fs.writeFileSync(reportPath, JSON.stringify(res, null, 2));

  console.log(`[+] Ablation Results Report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Ablation study run failed:', err);
  process.exit(1);
});
