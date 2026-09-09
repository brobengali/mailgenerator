import { SyntheticDatasetGenerator } from '../src/data/datasetGenerator.js';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('================================================================');
  console.log(' SYNTHETIC DATASET GENERATION & ZERO-LEAKAGE SPLITTER');
  console.log('================================================================\n');

  const generator = new SyntheticDatasetGenerator(42);
  const fullDataset = generator.generateFullDataset();
  const splits = generator.splitDataset(fullDataset);
  const humanBenchmark = generator.generateHumanValidationBenchmark(splits.test);

  const datasetDir = path.join(process.cwd(), 'dataset');
  if (!fs.existsSync(datasetDir)) {
    fs.mkdirSync(datasetDir, { recursive: true });
  }

  // 1. Raw full dataset
  fs.writeFileSync(path.join(datasetDir, 'raw_dataset.json'), JSON.stringify(fullDataset, null, 2));
  console.log(`[+] Saved Raw Full Dataset: ${fullDataset.length} records -> dataset/raw_dataset.json`);

  // 2. Train / Retrieval Set (240 records)
  fs.writeFileSync(path.join(datasetDir, 'train_retrieval.json'), JSON.stringify(splits.train, null, 2));
  console.log(`[+] Saved Train/Retrieval Index Set: ${splits.train.length} records -> dataset/train_retrieval.json`);

  // 3. Validation Set (30 records)
  fs.writeFileSync(path.join(datasetDir, 'val_set.json'), JSON.stringify(splits.val, null, 2));
  console.log(`[+] Saved Validation Set: ${splits.val.length} records -> dataset/val_set.json`);

  // 4. Held-Out Test Set (30 records)
  fs.writeFileSync(path.join(datasetDir, 'test_set.json'), JSON.stringify(splits.test, null, 2));
  console.log(`[+] Saved Held-Out Test Set: ${splits.test.length} records -> dataset/test_set.json (ZERO LEAKAGE)`);

  // 5. Human Validation Benchmark (40 records)
  fs.writeFileSync(path.join(datasetDir, 'human_eval_benchmark.json'), JSON.stringify(humanBenchmark, null, 2));
  console.log(`[+] Saved Human Validation Benchmark: ${humanBenchmark.length} records -> dataset/human_eval_benchmark.json\n`);

  console.log('Dataset categories generated: 21 distinct enterprise & personal categories.');
  console.log('Seed: 42 (100% deterministic & reproducible)');
}

main().catch(err => {
  console.error('Dataset generation failed:', err);
  process.exit(1);
});
