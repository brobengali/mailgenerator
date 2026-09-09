export type EmailCategory = 
  | 'meeting_scheduling'
  | 'meeting_rescheduling'
  | 'interview_invitation'
  | 'job_application'
  | 'customer_support'
  | 'refund_request'
  | 'order_issue'
  | 'project_update'
  | 'deadline_request'
  | 'approval_request'
  | 'document_request'
  | 'info_request'
  | 'introduction'
  | 'networking'
  | 'follow_up'
  | 'complaint'
  | 'thank_you'
  | 'confirmation'
  | 'cancellation'
  | 'technical_support'
  | 'academic_professional';

export type CustomerTone = 'polite' | 'frustrated' | 'urgent' | 'formal' | 'casual' | 'ambiguous';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface RecordMetadata {
  tone: CustomerTone;
  intent: string;
  difficulty: DifficultyLevel;
  requires_action: boolean;
  key_facts?: {
    dates?: string[];
    times?: string[];
    names?: string[];
    numbers?: string[];
    urls?: string[];
  };
}

export interface EmailRecord {
  id: string;
  category: EmailCategory;
  subject: string;
  incoming_email: string;
  reference_reply: string;
  metadata: RecordMetadata;
}

export interface DatasetSplit {
  train: EmailRecord[];
  val: EmailRecord[];
  test: EmailRecord[];
}

export interface RAGConfig {
  top_k: number;
  enable_rag: boolean;
  tone_directive: CustomerTone | 'professional' | 'empathetic' | 'concise';
  temperature: number;
  provider: 'gemini' | 'openai' | 'mock';
}

export interface RetrievedExample {
  record: EmailRecord;
  similarity_score: number;
}

export interface GenerationOutput {
  email_id?: string;
  subject: string;
  incoming_email: string;
  suggested_reply: string;
  retrieved_examples: RetrievedExample[];
  generation_time_ms: number;
  model_used: string;
  is_rag_enabled: boolean;
}

export interface EvaluationScores {
  semantic_correctness: number;  // 0 - 1.0 (25% weight)
  task_completion: number;       // 0 - 1.0 (25% weight)
  key_fact_consistency: number;  // 0 - 1.0 (20% weight)
  contradiction_safety: number;  // 0 - 1.0 (15% weight)
  completeness: number;          // 0 - 1.0 (10% weight)
  tone_style: number;            // 0 - 1.0 (5% weight)
}

export interface PerResponseReport {
  email_id: string;
  category: EmailCategory;
  incoming_email: string;
  reference_reply: string;
  generated_reply: string;
  scores: EvaluationScores;
  overall_score: number;         // 0 - 1.0
  safety_gated: boolean;         // True if score was capped due to contradiction/fact error
  quality_grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  decision: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unsafe';
  strengths: string[];
  issues: string[];
  confidence: number;
}

export interface AggregateSystemReport {
  total_evaluated: number;
  average_overall_score: number;
  pass_rate: number;             // percentage (0 - 100)
  safety_gated_count: number;
  per_dimension_averages: EvaluationScores;
  grade_distribution: Record<string, number>;
  category_breakdown: Record<string, { count: number; avg_score: number }>;
  evaluation_time_ms: number;
  per_response_reports: PerResponseReport[];
}

export interface HumanEvalRecord {
  test_id: string;
  incoming_email: string;
  reference_reply: string;
  candidate_reply: string;
  human_rating: number; // 1 to 5
  tier: 'expert' | 'rag' | 'mediocre' | 'bad';
}

export interface CorrelationResult {
  sample_size: number;
  spearman_rho: number;
  pearson_r: number;
  mae: number;
  dimension_correlations: Record<string, number>;
  statistically_significant: boolean;
}

export interface AblationResult {
  baseline_a_zero_shot: { avg_score: number; pass_rate: number; safety_gated_count: number };
  baseline_b_rag: { avg_score: number; pass_rate: number; safety_gated_count: number };
  baseline_c_rag_safety: { avg_score: number; pass_rate: number; safety_gated_count: number };
  lift_b_over_a_pct: number;
  lift_c_over_b_pct: number;
}
