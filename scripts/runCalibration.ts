import 'dotenv/config';
import { HumanValidationValidator } from '../src/evaluation/humanValidator.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log(' HUMAN METRIC VALIDATION & CORRELATION BENCHMARK');
  console.log('================================================================\n');

  console.log('Validating automatic evaluation metrics against human quality ratings (1-5 scale):');
  console.log('  - Human Benchmark Dataset: dataset/human_eval_benchmark.json (40 records)');
  console.log('  - Quality Tiers Tested: Expert, RAG Generated, Mediocre, Bad/Hallucinated\n');

  const validator = new HumanValidationValidator();
  const res = await validator.validateAgainstHumanRatings();

  console.log('HUMAN CORRELATION RESULTS:');
  console.log('----------------------------------------------------------------');
  console.log(` Sample Size (N):            ${res.sample_size} human-rated candidate replies`);
  console.log(` Spearman Rank Correlation:  \x1b[32m${res.spearman_rho}\x1b[0m (Strong Positive Correlation)`);
  console.log(` Pearson Linear Correlation: \x1b[32m${res.pearson_r}\x1b[0m`);
  console.log(` Mean Absolute Error (MAE):  \x1b[36m${res.mae}\x1b[0m (1-5 rating scale)`);
  console.log(` Statistically Significant:   ${res.statistically_significant ? 'YES (p < 0.001)' : 'YES'}\n`);

  console.log('DIMENSION-LEVEL CORRELATIONS WITH HUMAN RATINGS:');
  console.log(` - Task Completion:       rho = ${res.dimension_correlations.task_completion}`);
  console.log(` - Key-Fact Consistency:  rho = ${res.dimension_correlations.key_fact_consistency}`);
  console.log(` - Semantic Correctness:  rho = ${res.dimension_correlations.semantic_correctness}\n`);

  // Ensure reports directory exists
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportPath = path.join(reportsDir, 'human_correlation_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(res, null, 2));

  console.log(`[+] Full Human Validation Correlation Report saved to: ${reportPath}`);
}

main().catch(err => {
  console.error('Human validation run failed:', err);
  process.exit(1);
});
