import rawDatasetData from '../../dataset/raw_dataset.json';
import trainData from '../../dataset/train_retrieval.json';
import valData from '../../dataset/val_set.json';
import testData from '../../dataset/test_set.json';
import humanBenchmarkData from '../../dataset/human_eval_benchmark.json';

import { EmailRecord, EmailCategory, HumanEvalRecord } from '../types/index';

export class DatasetLoader {
  private static rawDataset: EmailRecord[] = rawDatasetData as EmailRecord[];
  private static trainDataset: EmailRecord[] = trainData as EmailRecord[];
  private static valDataset: EmailRecord[] = valData as EmailRecord[];
  private static testDataset: EmailRecord[] = testData as EmailRecord[];
  private static humanBenchmark: HumanEvalRecord[] = humanBenchmarkData as HumanEvalRecord[];

  public static getRawDataset(): EmailRecord[] {
    return [...this.rawDataset];
  }

  /**
   * Retrieves the training dataset used EXCLUSIVELY for RAG vector retrieval indexing.
   */
  public static getTrainDataset(): EmailRecord[] {
    return [...this.trainDataset];
  }

  /**
   * Retrieves the validation dataset.
   */
  public static getValDataset(): EmailRecord[] {
    return [...this.valDataset];
  }

  /**
   * Retrieves the held-out test benchmark dataset.
   * ZERO LEAKAGE GUARANTEE: None of these records exist in the train/retrieval set!
   */
  public static getTestDataset(): EmailRecord[] {
    return [...this.testDataset];
  }

  /**
   * Retrieves the human-labeled validation benchmark for Spearman/Pearson correlation analysis.
   */
  public static getHumanBenchmark(): HumanEvalRecord[] {
    return [...this.humanBenchmark];
  }

  public static getRecordById(id: string): EmailRecord | undefined {
    return this.rawDataset.find(r => r.id === id);
  }

  public static getTrainRecordsByCategory(category: EmailCategory): EmailRecord[] {
    return this.trainDataset.filter(r => r.category === category);
  }
}
