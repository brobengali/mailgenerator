import React, { useState } from 'react';
import { Navbar } from './web/components/Navbar';
import { GeneratorPlayground } from './web/components/GeneratorPlayground';
import { BatchEvaluationView } from './web/components/BatchEvaluationView';
import { MetricCalibrationView } from './web/components/MetricCalibrationView';
import { DatasetExplorerView } from './web/components/DatasetExplorerView';
import { DatasetLoader } from './data/datasetLoader';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'playground' | 'evaluation' | 'calibration' | 'dataset'>('playground');
  const pastEmailsCount = DatasetLoader.getTrainDataset().length;

  return (
    <div className="min-h-screen flex flex-col" style={{ color: '#1e1b4b' }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} datasetCount={pastEmailsCount} />

      {/* ── Page Header Strip ── */}
      <div
        className="border-b"
        style={{
          background: 'linear-gradient(180deg, rgba(139,92,246,0.06) 0%, rgba(255,255,255,0.4) 100%)',
          borderColor: 'rgba(139,92,246,0.12)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider"
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    border: '1px solid rgba(124,58,237,0.22)',
                    color: '#6d28d9',
                  }}
                >
                  Few-Shot RAG · Multi-Metric Evaluation
                </span>
                <span className="text-gray-300 text-xs">•</span>
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Gemini Flash Grounded
                </span>
              </div>
              <h1
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg,#5b21b6 0%,#7c3aed 40%,#4f46e5 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                AI Email Response Workbench
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 font-medium">
                Context-aware email reply generation grounded in enterprise history, paired with real-time empirical scoring.
              </p>
            </div>

            {/* Quick Context Chips */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              <span
                className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  color: '#6d28d9',
                  boxShadow: '0 2px 8px -2px rgba(124,58,237,0.08)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                {pastEmailsCount} Knowledge Pairs
              </span>
              <span
                className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                style={{
                  background: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(8,145,178,0.2)',
                  color: '#0891b2',
                  boxShadow: '0 2px 8px -2px rgba(8,145,178,0.08)',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                6 Eval Metrics
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'playground'  && <GeneratorPlayground />}
        {activeTab === 'evaluation'  && <BatchEvaluationView />}
        {activeTab === 'calibration' && <MetricCalibrationView />}
        {activeTab === 'dataset'     && <DatasetExplorerView />}
      </main>

      {/* ── Footer ── */}
      <footer
        className="py-5 text-center"
        style={{
          borderTop: '1px solid rgba(139,92,246,0.12)',
          background: 'rgba(245,243,255,0.6)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-gray-500">
            AI Email Suggested-Response & Multi-Metric Accuracy Evaluation System
          </span>
          <span
            className="text-[11px] font-mono font-semibold"
            style={{ color: '#7c3aed' }}
          >
            Google Gemini RAG • Evaluation Engine v1.0
          </span>
        </div>
      </footer>
    </div>
  );
};
