import React, { useState, useEffect } from 'react';
import { AggregateSystemReport, PerResponseReport } from '../../types';
import { DatasetLoader } from '../../data/datasetLoader';
import { RAGEngine } from '../../generator/ragEngine';
import { MultiDimensionalEvaluator } from '../../evaluation/evaluator';
import { ScoreBadge } from './ScoreBadge';
import { Play, CheckCircle2, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Award, FileText } from 'lucide-react';

export const BatchEvaluationView: React.FC = () => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [summary, setSummary] = useState<AggregateSystemReport | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const runFullBenchmark = async () => {
    setIsRunning(true);
    const trainSet = DatasetLoader.getTrainDataset();
    const testSet = DatasetLoader.getTestDataset();

    const ragEngine = new RAGEngine(trainSet);
    const evaluator = new MultiDimensionalEvaluator();
    const startTime = Date.now();

    const reports: PerResponseReport[] = [];

    for (const testCase of testSet) {
      const genResult = await ragEngine.generateSuggestedResponse(
        testCase.subject,
        testCase.incoming_email,
        { top_k: 2, enable_rag: true, tone_directive: 'professional' }
      );

      const evalRes = await evaluator.evaluateSingleReply(
        testCase.id,
        testCase.category,
        testCase.incoming_email,
        genResult.suggested_reply,
        testCase.reference_reply
      );

      reports.push(evalRes);
    }

    const totalTime = Date.now() - startTime;
    const finalSummary = evaluator.summarizeSystemPerformance(reports, totalTime);
    setSummary(finalSummary);
    setIsRunning(false);
  };

  useEffect(() => {
    runFullBenchmark();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(139,92,246,0.2)',
          boxShadow: '0 4px 20px -6px rgba(124,58,237,0.08)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2.5" style={{ color: '#1e1b4b' }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                  boxShadow: '0 4px 12px -3px rgba(124,58,237,0.4)',
                }}
              >
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span
                style={{
                  background: 'linear-gradient(135deg,#5b21b6,#7c3aed,#4f46e5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Empirical Accuracy Benchmark Suite
              </span>
            </h2>
            <p className="text-xs text-gray-500 max-w-xl">
              Multi-criteria evaluation suite scoring Intent Resolution, Factual Accuracy, Tone Alignment, and Lexical similarity across 30 held-out test cases.
            </p>
          </div>

          <button
            onClick={runFullBenchmark}
            disabled={isRunning}
            className="glow-button px-5 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 disabled:opacity-50 self-start sm:self-auto cursor-pointer"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating Test Cases…</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Re-Run Benchmark</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isRunning && (
        <div
          className="rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '1px solid rgba(139,92,246,0.2)',
          }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
              boxShadow: '0 8px 24px -4px rgba(124,58,237,0.4)',
            }}
          >
            <RefreshCw className="w-6 h-6 text-white animate-spin" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold" style={{ color: '#1e1b4b' }}>
              Running Multi-Criteria Accuracy Suite across 30 Test Cases…
            </p>
            <p className="text-xs text-gray-500 font-mono">
              Scoring Semantic, Task Resolution, Factual Consistency, and Safety dimensions
            </p>
          </div>
        </div>
      )}

      {summary && !isRunning && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'System Accuracy (EQI)',
                value: `${Math.round(summary.average_overall_score * 100)}%`,
                sub: `Pass Rate: ${summary.pass_rate}%`,
                subColor: '#059669',
                badge: 'EQI',
                badgeBg: 'rgba(124,58,237,0.08)',
                badgeBorder: 'rgba(124,58,237,0.25)',
                badgeColor: '#6d28d9',
              },
              {
                label: 'Evaluated Test Emails',
                value: `${summary.total_evaluated}`,
                sub: 'Zero-Leakage Test Split',
                subColor: '#6b7280',
                badge: '✓',
                badgeBg: 'rgba(16,185,129,0.08)',
                badgeBorder: 'rgba(16,185,129,0.25)',
                badgeColor: '#059669',
              },
              {
                label: 'Semantic Correctness',
                value: `${Math.round(summary.per_dimension_averages.semantic_correctness * 100)}%`,
                sub: 'Vector Alignment (25%)',
                subColor: '#4f46e5',
                badge: '25%',
                badgeBg: 'rgba(99,102,241,0.08)',
                badgeBorder: 'rgba(99,102,241,0.25)',
                badgeColor: '#4f46e5',
              },
              {
                label: 'Factual Consistency',
                value: `${Math.round(summary.per_dimension_averages.key_fact_consistency * 100)}%`,
                sub: 'Key-Fact Check (20%)',
                subColor: '#d97706',
                badge: '20%',
                badgeBg: 'rgba(245,158,11,0.08)',
                badgeBorder: 'rgba(245,158,11,0.25)',
                badgeColor: '#d97706',
              },
            ].map(kpi => (
              <div
                key={kpi.label}
                className="p-5 rounded-2xl flex items-center justify-between"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  border: '1px solid rgba(139,92,246,0.18)',
                  boxShadow: '0 2px 12px -2px rgba(124,58,237,0.06)',
                }}
              >
                <div>
                  <p className="text-xs font-semibold text-gray-500">{kpi.label}</p>
                  <p className="text-2xl sm:text-3xl font-extrabold font-mono mt-1" style={{ color: '#1e1b4b' }}>
                    {kpi.value}
                  </p>
                  <p className="text-[11px] font-semibold mt-1" style={{ color: kpi.subColor }}>
                    {kpi.sub}
                  </p>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs font-mono flex-shrink-0"
                  style={{ background: kpi.badgeBg, border: `1px solid ${kpi.badgeBorder}`, color: kpi.badgeColor }}
                >
                  {kpi.badge}
                </div>
              </div>
            ))}
          </div>

          {/* Per-Response Evaluation Breakdown List */}
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(139,92,246,0.18)',
              boxShadow: '0 4px 20px -6px rgba(124,58,237,0.06)',
            }}
          >
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>
                  Per-Response Accuracy Breakdown
                </h3>
                <p className="text-xs text-gray-500">
                  Detailed inspection of generated responses vs ground-truth references
                </p>
              </div>
              <span className="text-xs font-mono text-gray-400">
                {summary.per_response_reports.length} Records
              </span>
            </div>

            <div className="space-y-2.5">
              {summary.per_response_reports.map(detail => {
                const isExpanded = expandedId === detail.email_id;
                return (
                  <div
                    key={detail.email_id}
                    className="rounded-xl overflow-hidden transition-all"
                    style={{
                      background: isExpanded ? '#ffffff' : '#fcfbfe',
                      border: isExpanded ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(139,92,246,0.15)',
                      boxShadow: isExpanded ? '0 4px 16px -4px rgba(124,58,237,0.1)' : 'none',
                    }}
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : detail.email_id)}
                      className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-purple-50/40 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{
                            background: detail.overall_score >= 0.70 ? '#10b981' : '#ef4444',
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold font-mono" style={{ color: '#1e1b4b' }}>
                            <span className="text-purple-700 font-semibold">[{detail.category.replace('_', ' ').toUpperCase()}]</span> {detail.email_id}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Status: <span className="font-semibold uppercase" style={{ color: detail.overall_score >= 0.70 ? '#059669' : '#dc2626' }}>{detail.decision}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <ScoreBadge score={Math.round(detail.overall_score * 100)} label="EQI" />
                        <span
                          className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg"
                          style={{
                            background: 'rgba(124,58,237,0.08)',
                            color: '#6d28d9',
                            border: '1px solid rgba(124,58,237,0.2)',
                          }}
                        >
                          {detail.quality_grade}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 border-t border-purple-100 bg-purple-50/20 space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <span className="font-bold flex items-center gap-1.5" style={{ color: '#6d28d9' }}>
                              <FileText className="w-3.5 h-3.5" /> Generated Suggested Reply:
                            </span>
                            <div className="p-3.5 bg-white rounded-xl border border-purple-100 font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {detail.generated_reply}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="font-bold flex items-center gap-1.5" style={{ color: '#059669' }}>
                              <Award className="w-3.5 h-3.5" /> Expert Reference Reply:
                            </span>
                            <div className="p-3.5 bg-white rounded-xl border border-emerald-100 font-mono text-gray-800 leading-relaxed whitespace-pre-wrap">
                              {detail.reference_reply}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-purple-100 flex flex-wrap items-center justify-between gap-2 font-mono text-gray-600 text-[11px]">
                          <span>Semantic: <strong className="text-purple-700">{(detail.scores.semantic_correctness * 100).toFixed(0)}%</strong></span>
                          <span>Task: <strong className="text-emerald-700">{(detail.scores.task_completion * 100).toFixed(0)}%</strong></span>
                          <span>Facts: <strong className="text-indigo-700">{(detail.scores.key_fact_consistency * 100).toFixed(0)}%</strong></span>
                          <span>Safety: <strong className="text-amber-700">{(detail.scores.contradiction_safety * 100).toFixed(0)}%</strong></span>
                          <span>Completeness: <strong className="text-cyan-700">{(detail.scores.completeness * 100).toFixed(0)}%</strong></span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

