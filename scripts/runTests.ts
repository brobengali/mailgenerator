import 'dotenv/config';
import { DatasetLoader } from '../src/data/datasetLoader';
import { VectorStore } from '../src/generator/vectorStore';
import { RAGEngine } from '../src/generator/ragEngine';
import { KeyFactConsistencyEvaluator } from '../src/evaluation/factExtractor';
import { ContradictionDetector } from '../src/evaluation/contradictionDetector';
import { MultiDimensionalEvaluator } from '../src/evaluation/evaluator';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(` \x1b[32m✓ PASSED\x1b[0m: ${testName}`);
  } else {
    console.error(` \x1b[31m✗ FAILED\x1b[0m: ${testName}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log('================================================================');
  console.log(' AUTOMATED UNIT & END-TO-END INTEGRATION TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Dataset Schema & Count
  const rawData = DatasetLoader.getRawDataset();
  assert(rawData.length >= 300, `Dataset size is ${rawData.length} (target: 300+ records)`);
  assert(rawData.every(r => r.id && r.category && r.incoming_email && r.reference_reply), 'All records contain required schema fields');

  // Test 2: Train/Val/Test Split & Zero Leakage Verification
  const trainSet = DatasetLoader.getTrainDataset();
  const testSet = DatasetLoader.getTestDataset();
  assert(trainSet.length === 255, `Train retrieval set contains ${trainSet.length} records`);
  assert(testSet.length === 30, `Held-out test set contains ${testSet.length} records`);

  const trainIds = new Set(trainSet.map(r => r.id));
  const testIds = testSet.map(r => r.id);
  const leakageCount = testIds.filter(id => trainIds.has(id)).length;
  assert(leakageCount === 0, `Zero Leakage Check: ${leakageCount} test IDs found in retrieval index`);

  // Test 3: RAG Vector Retriever
  const vectorStore = new VectorStore(trainSet);
  const retrieved = await vectorStore.retrieveTopK('HTTP 504 Gateway Timeout during push', 'Payload over 5MB', 2);
  assert(retrieved.length === 2, `Vector Store returned top-2 retrieved contexts`);
  assert(retrieved[0].similarity_score > 0, `Similarity score is positive (${retrieved[0].similarity_score.toFixed(3)})`);

  // Test 4: Key Fact Extraction
  const facts = KeyFactConsistencyEvaluator.extractFacts('Meeting on Tuesday at 2:00 PM EST for $299 invoice #INV-88492');
  assert(facts.datesTimes.length >= 2, `Extracted dates/times: ${facts.datesTimes.join(', ')}`);
  assert(facts.numbersAmounts.includes('$299'), `Extracted price amount $299`);
  assert(facts.codes.includes('#inv-88492'), `Extracted code #inv-88492`);

  // Test 5: Key Fact Consistency Evaluator
  const factScoreGood = KeyFactConsistencyEvaluator.computeKeyFactConsistency(
    'Meeting on Tuesday at 2:00 PM EST for $299',
    'Meeting on Tuesday at 2:00 PM EST for $299'
  );
  assert(factScoreGood === 1.0, `Key Fact Consistency perfect match score is 1.0 (${factScoreGood})`);

  const factScoreBad = KeyFactConsistencyEvaluator.computeKeyFactConsistency(
    'Meeting on Thursday at 5:00 PM EST for $999',
    'Meeting on Tuesday at 2:00 PM EST for $299'
  );
  assert(factScoreBad < 0.5, `Altered dates/prices score heavily penalized (${factScoreBad})`);

  // Test 6: Contradiction & Hallucination Safety Detector
  const contradictionRes = ContradictionDetector.computeContradictionSafety(
    'Is VAT included?',
    'We permit 500MB payloads and flat 50% tax.',
    'VAT reverse charge applied.'
  );
  assert(contradictionRes.safetyScore <= 0.2, `Hallucinated response safety score penalized (${contradictionRes.safetyScore})`);

  // Test 7: Multi-Dimensional Evaluator & Safety Gating
  const evaluator = new MultiDimensionalEvaluator();
  const reportUnsafe = await evaluator.evaluateSingleReply(
    'test_01',
    'technical_support',
    'Is VAT tax included?',
    'We permit 500MB payloads and flat 50% tax.',
    'VAT reverse charge applied.'
  );
  assert(reportUnsafe.safety_gated === true, `Safety Gate triggered on hallucinated reply`);
  assert(reportUnsafe.overall_score <= 0.45, `Overall score capped at <= 0.45 (${reportUnsafe.overall_score})`);
  assert(reportUnsafe.decision === 'unsafe', `Decision categorized as 'unsafe'`);

  // Test 8: End-to-End Generation & Evaluation in Offline/Mock Mode
  const ragEngine = new RAGEngine(trainSet);
  const genOutput = await ragEngine.generateSuggestedResponse(
    testSet[0].subject,
    testSet[0].incoming_email,
    { top_k: 2, enable_rag: true, tone_directive: 'professional' }
  );
  assert(genOutput.suggested_reply.length > 20, `Generated suggested reply successfully (${genOutput.suggested_reply.length} chars)`);

  const evalOutput = await evaluator.evaluateSingleReply(
    testSet[0].id,
    testSet[0].category,
    testSet[0].incoming_email,
    genOutput.suggested_reply,
    testSet[0].reference_reply
  );
  assert(evalOutput.overall_score >= 0.65, `End-to-end evaluation score passed (Score: ${(evalOutput.overall_score * 100).toFixed(1)}%)`);

  console.log('\n================================================================');
  console.log(` TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
