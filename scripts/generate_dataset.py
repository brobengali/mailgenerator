import json
import os
import random

def generate_dataset(seed=42):
    random.seed(seed)
    categories = [
        "meeting_scheduling", "meeting_rescheduling", "interview_invitation", "job_application",
        "customer_support", "refund_request", "order_issue", "project_update",
        "deadline_request", "approval_request", "document_request", "info_request",
        "introduction", "networking", "follow_up", "complaint",
        "thank_you", "confirmation", "cancellation", "technical_support", "academic_professional"
    ]

    records = []
    id_counter = 1

    for cat in categories:
        for i in range(1, 16):
            record = {
                "id": f"record_{id_counter:03d}",
                "category": cat,
                "subject": f"Inquiry re: {cat.replace('_', ' ').title()} (#{i})",
                "incoming_email": f"Hello Support Team,\n\nI am contacting you regarding an inquiry under {cat.replace('_', ' ')}. Please assist with resolution.\n\nRegards,\nCustomer",
                "reference_reply": f"Hello,\n\nThank you for reaching out regarding your {cat.replace('_', ' ')} inquiry. We have processed your request and confirmed the resolution.\n\nBest regards,\nSupport Desk",
                "metadata": {
                    "tone": "polite",
                    "intent": f"Resolve {cat.replace('_', ' ')} request",
                    "difficulty": "medium",
                    "requires_action": True
                }
            }
            records.append(record)
            id_counter += 1

    shuffled = list(records)
    random.shuffle(shuffled)

    test = shuffled[:30]
    val = shuffled[30:60]
    train = shuffled[60:]

    os.makedirs("dataset", exist_ok=True)

    with open("dataset/raw_dataset.json", "w") as f:
        json.dump(records, f, indent=2)

    with open("dataset/train_retrieval.json", "w") as f:
        json.dump(train, f, indent=2)

    with open("dataset/val_set.json", "w") as f:
        json.dump(val, f, indent=2)

    with open("dataset/test_set.json", "w") as f:
        json.dump(test, f, indent=2)

    print(f"[+] Python Dataset Generator: Created {len(records)} records (Train: {len(train)}, Val: {len(val)}, Test: {len(test)}).")

if __name__ == "__main__":
    generate_dataset()
