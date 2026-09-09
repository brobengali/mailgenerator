import json
import os

def test_dataset_exists_and_valid():
    assert os.path.exists("dataset/raw_dataset.json"), "raw_dataset.json must exist"
    with open("dataset/raw_dataset.json") as f:
        data = json.load(f)
    assert len(data) >= 300, f"Dataset size {len(data)} should be >= 300"
    for r in data:
        assert "id" in r and "category" in r and "incoming_email" in r and "reference_reply" in r

def test_zero_leakage_split():
    with open("dataset/train_retrieval.json") as f:
        train = json.load(f)
    with open("dataset/test_set.json") as f:
        test = json.load(f)

    train_ids = set(r["id"] for r in train)
    test_ids = [r["id"] for r in test]
    leakage = [tid for tid in test_ids if tid in train_ids]
    assert len(leakage) == 0, f"Zero leakage assertion failed: {leakage} found in train set"

def test_reports_exist():
    assert os.path.exists("reports/evaluation_results.json"), "evaluation_results.json must exist"
    assert os.path.exists("reports/human_correlation_report.json"), "human_correlation_report.json must exist"
