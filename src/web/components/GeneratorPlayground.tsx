import React, { useState } from 'react';
import { GenerationOutput, PerResponseReport, RetrievedExample } from '../../types';
import { DatasetLoader } from '../../data/datasetLoader';
import { RAGEngine } from '../../generator/ragEngine';
import { MultiDimensionalEvaluator } from '../../evaluation/evaluator';
import { ScoreBadge } from './ScoreBadge';
import { ScoreDial } from './ScoreDial';
import {
  Sparkles, RefreshCw, Send, Copy, Check,
  BookOpen, Sliders, MessageSquare, ShieldCheck, Zap,
  ChevronDown, ChevronUp, RotateCcw, AlertCircle, FileText
} from 'lucide-react';

/* ─── Bar Gradient Colors ─── */
const barColors: Record<string, string> = {
  semantic: 'linear-gradient(90deg, #7c3aed, #6366f1)',
  task:     'linear-gradient(90deg, #0891b2, #6366f1)',
  fact:     'linear-gradient(90deg, #a78bfa, #818cf8)',
  safety:   'linear-gradient(90deg, #059669, #10b981)',
  complete: 'linear-gradient(90deg, #f59e0b, #f97316)',
};

export const GeneratorPlayground: React.FC = () => {
  const sampleCases = DatasetLoader.getTestDataset();
  const trainEmails = DatasetLoader.getTrainDataset();

  const [selectedSampleId, setSelectedSampleId] = useState<string>(sampleCases[0].id);
  const [subject, setSubject]               = useState<string>(sampleCases[0].subject);
  const [incomingBody, setIncomingBody]     = useState<string>(sampleCases[0].incoming_email);
  const [referenceReply, setReferenceReply] = useState<string>(sampleCases[0].reference_reply);
  const [showReference, setShowReference]   = useState<boolean>(false);

  const [enableRAG, setEnableRAG] = useState<boolean>(true);
  const [topK, setTopK]           = useState<number>(2);
  const [tone, setTone]           = useState<'professional' | 'empathetic' | 'concise'>('professional');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied]             = useState<boolean>(false);
  const [result, setResult]             = useState<GenerationOutput | null>(null);
  const [evaluation, setEvaluation]     = useState<PerResponseReport | null>(null);
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);

  const handleSelectSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    if (sampleId === 'custom') {
      setSubject('');
      setIncomingBody('');
      setReferenceReply('');
      setResult(null);
      setEvaluation(null);
      setErrorMsg(null);
      return;
    }

    const found = sampleCases.find(s => s.id === sampleId);
    if (found) {
      setSubject(found.subject);
      setIncomingBody(found.incoming_email);
      setReferenceReply(found.reference_reply);
      setResult(null);
      setEvaluation(null);
      setErrorMsg(null);
    }
  };

  const handleGenerateAndEvaluate = async () => {
    if (!incomingBody.trim()) return;
    setIsGenerating(true);
    setResult(null);
    setEvaluation(null);
    setErrorMsg(null);

    try {
      const ragEngine = new RAGEngine(trainEmails);
      const genResult = await ragEngine.generateSuggestedResponse(subject, incomingBody, {
        top_k: topK,
        enable_rag: enableRAG,
        tone_directive: tone,
      });
      setResult(genResult);

      const compositeEval = new MultiDimensionalEvaluator();
      const evalRes = await compositeEval.evaluateSingleReply(
        selectedSampleId || 'custom-inquiry',
        'technical_support',
        incomingBody,
        genResult.suggested_reply,
        referenceReply || genResult.suggested_reply
      );
      setEvaluation(evalRes);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg(err?.message || 'An unexpected error occurred during generation.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToneChange = async (newTone: 'professional' | 'empathetic' | 'concise') => {
    setTone(newTone);
    if (result && incomingBody.trim()) {
      setIsGenerating(true);
      setErrorMsg(null);
      try {
        const ragEngine = new RAGEngine(trainEmails);
        const genResult = await ragEngine.generateSuggestedResponse(subject, incomingBody, {
          top_k: topK,
          enable_rag: enableRAG,
          tone_directive: newTone,
        });
        setResult(genResult);

        const compositeEval = new MultiDimensionalEvaluator();
        const evalRes = await compositeEval.evaluateSingleReply(
          selectedSampleId || 'custom-inquiry',
          'technical_support',
          incomingBody,
          genResult.suggested_reply,
          referenceReply || genResult.suggested_reply
        );
        setEvaluation(evalRes);
      } catch (err: any) {
        console.error('Tone update error:', err);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleGenerateAndEvaluate();
    }
  };

  const handleCopyReply = () => {
    if (result) {
      navigator.clipboard.writeText(result.suggested_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">

      {/* ── Top Bar: Scenario Quick-Picker & Tone ── */}
      <div
        className="rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(139,92,246,0.18)',
          boxShadow: '0 4px 20px -6px rgba(124,58,237,0.08)',
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
              boxShadow: '0 4px 12px -3px rgba(124,58,237,0.45)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>
              Select Email Scenario
            </h2>
            <p className="text-[11px] text-gray-500">
              Pick an enterprise inquiry or write your own custom request
            </p>
          </div>
        </div>

        {/* Dropdown & Quick Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedSampleId}
            onChange={e => handleSelectSample(e.target.value)}
            className="text-xs font-semibold rounded-xl px-3.5 py-2 transition-all focus:outline-none cursor-pointer"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(139,92,246,0.25)',
              color: '#4c1d95',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}
          >
            <optgroup label="Preset Test Scenarios">
              {sampleCases.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}: {s.subject.length > 40 ? s.subject.substring(0, 40) + '…' : s.subject}
                </option>
              ))}
            </optgroup>
            <option value="custom">✏️ Write Custom Email...</option>
          </select>

          {/* Quick-select pills for top 3 cases */}
          <div className="hidden sm:flex items-center gap-1.5 pl-1">
            {sampleCases.slice(0, 3).map((s, idx) => {
              const labels = ['Refund', 'SSO Auth', 'Demo Call'];
              const isSelected = selectedSampleId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => handleSelectSample(s.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all"
                  style={isSelected ? {
                    background: 'rgba(124,58,237,0.12)',
                    color: '#6d28d9',
                    border: '1px solid rgba(124,58,237,0.3)',
                  } : {
                    background: 'transparent',
                    color: '#6b7280',
                    border: '1px solid transparent',
                  }}
                >
                  {labels[idx]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Main 2-Column Workbench ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT COLUMN: Clean Inquiry Form (5 cols) ── */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className="rounded-2xl p-5 sm:p-6 space-y-4"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(139,92,246,0.18)',
              boxShadow: '0 4px 24px -6px rgba(124,58,237,0.08)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#4c1d95' }}>
                  Customer Inquiry
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSelectSample('custom')}
                className="text-[11px] font-medium text-gray-400 hover:text-purple-600 flex items-center gap-1 transition-colors"
                title="Clear and write custom email"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            </div>

            {/* Subject Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Request for subscription refund"
                className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all"
                style={{
                  background: '#ffffff',
                  borderColor: 'rgba(139,92,246,0.22)',
                  color: '#1e1b4b',
                }}
              />
            </div>

            {/* Incoming Body Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-gray-700">
                  Email Message Body
                </label>
                <span className="text-[10px] text-gray-400 font-mono">
                  {incomingBody.length} chars
                </span>
              </div>
              <textarea
                rows={6}
                value={incomingBody}
                onChange={e => setIncomingBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Paste or type the customer inquiry message here..."
                className="w-full text-xs font-mono leading-relaxed px-3.5 py-2.5 rounded-xl border focus:outline-none transition-all resize-none"
                style={{
                  background: '#ffffff',
                  borderColor: 'rgba(139,92,246,0.22)',
                  color: '#1e1b4b',
                }}
              />
            </div>

            {/* Optional Collapsible: Ground-Truth Benchmark Reference */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowReference(!showReference)}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                style={{
                  background: showReference ? 'rgba(124,58,237,0.06)' : 'rgba(245,243,255,0.6)',
                  border: '1px dashed rgba(139,92,246,0.25)',
                  color: '#6d28d9',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {showReference ? 'Ground-Truth Reference Reply' : '+ Add Ground-Truth Reference (Optional)'}
                </span>
                {showReference ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showReference && (
                <div className="mt-2 space-y-1 animate-fadeIn">
                  <p className="text-[10px] text-gray-400">
                    Used to calculate Lexical & Semantic similarity against an ideal expert baseline.
                  </p>
                  <textarea
                    rows={3}
                    value={referenceReply}
                    onChange={e => setReferenceReply(e.target.value)}
                    placeholder="Enter expected expert response to benchmark accuracy against..."
                    className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border focus:outline-none resize-none"
                    style={{
                      background: '#fcfbfe',
                      borderColor: 'rgba(139,92,246,0.2)',
                      color: '#4c1d95',
                    }}
                  />
                </div>
              )}
            </div>

            {/* ── Settings Toolbar: Tone + RAG ── */}
            <div
              className="p-3.5 rounded-xl space-y-3"
              style={{
                background: 'rgba(245,243,255,0.7)',
                border: '1px solid rgba(139,92,246,0.15)',
              }}
            >
              {/* Tone Segmented Buttons */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-600">Response Tone:</span>
                <div className="flex items-center gap-1 p-0.5 bg-white rounded-lg border border-purple-100 shadow-sm">
                  {(['professional', 'empathetic', 'concise'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleToneChange(t)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-md capitalize transition-all cursor-pointer"
                      style={tone === t ? {
                        background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                        color: '#ffffff',
                        boxShadow: '0 2px 6px -1px rgba(124,58,237,0.3)',
                      } : {
                        color: '#6b7280',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* RAG Context Settings */}
              <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-100/60">
                <div className="flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-purple-600" />
                  <span className="font-semibold text-gray-700">Few-Shot RAG</span>
                </div>

                <div className="flex items-center gap-2">
                  {enableRAG && (
                    <select
                      value={topK}
                      onChange={e => setTopK(Number(e.target.value))}
                      className="text-[11px] font-mono font-medium rounded-md px-2 py-0.5 bg-white border border-purple-200 text-purple-900 focus:outline-none"
                    >
                      <option value={1}>Top 1</option>
                      <option value={2}>Top 2</option>
                      <option value={3}>Top 3</option>
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => setEnableRAG(!enableRAG)}
                    className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                    style={{
                      background: enableRAG ? 'linear-gradient(135deg,#7c3aed,#6366f1)' : '#cbd5e1',
                    }}
                  >
                    <span
                      className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                      style={{ transform: enableRAG ? 'translateX(1.1rem)' : 'translateX(0.15rem)' }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* ── Primary Action CTA ── */}
            <button
              type="button"
              onClick={handleGenerateAndEvaluate}
              disabled={isGenerating || !incomingBody.trim()}
              className="glow-button w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Context-Aware Reply…</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Generate Suggested Reply</span>
                  <span className="text-[10px] font-mono opacity-70 font-normal ml-1">(Ctrl + ↵)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Output & Accuracy Score (7 cols) ── */}
        <div className="lg:col-span-7 space-y-5">

          {/* Empty State */}
          {!result && !isGenerating && (
            <div
              className="rounded-2xl p-10 text-center flex flex-col items-center justify-center space-y-4 min-h-[460px]"
              style={{
                background: 'rgba(255,255,255,0.75)',
                border: '1px dashed rgba(139,92,246,0.25)',
              }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(99,102,241,0.08))',
                  border: '1px solid rgba(139,92,246,0.2)',
                }}
              >
                <Zap className="w-7 h-7 text-purple-600" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>
                  Response & Evaluation Preview
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Click <strong style={{ color: '#7c3aed' }}>Generate Suggested Reply</strong> to synthesize a grounded email response and receive real-time empirical accuracy scores.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-[11px] text-gray-400 font-mono">
                <span>RAG Retrieval</span> • <span>Multi-Dimensional Scoring</span> • <span>Safety Gating</span>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isGenerating && (
            <div
              className="rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4 min-h-[460px]"
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
                <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>
                  Synthesizing Suggested Response
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  Matching vector embeddings · Applying {tone} tone directive · Running 5-dimension evaluator
                </p>
              </div>
              <div className="flex gap-1.5 pt-2">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full animate-pulse"
                    style={{
                      height: `${14 + (i % 3) * 8}px`,
                      background: `rgba(124,58,237,${0.3 + i * 0.15})`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && !isGenerating && (
            <div
              className="rounded-2xl p-5 flex items-start gap-3.5"
              style={{
                background: 'rgba(254,242,242,0.9)',
                border: '1px solid rgba(239,68,68,0.3)',
              }}
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-red-800">Generation Notice</h4>
                <p className="text-xs text-red-700 font-mono">{errorMsg}</p>
                <p className="text-[11px] text-gray-500">
                  Note: Offline fallback mode will supply standard enterprise templates if external APIs are unreachable.
                </p>
              </div>
            </div>
          )}

          {/* Generated Result Container */}
          {result && (
            <div className="space-y-5 animate-fadeIn">

              {/* Suggested Reply Card */}
              <div
                className="rounded-2xl p-6 space-y-4"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1px solid rgba(139,92,246,0.22)',
                  boxShadow: '0 4px 20px -4px rgba(124,58,237,0.1)',
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>
                        Suggested AI Response
                      </h3>
                      <span
                        className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full capitalize"
                        style={{
                          background: 'rgba(124,58,237,0.08)',
                          color: '#6d28d9',
                        }}
                      >
                        {tone} Tone
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Generated in <span className="text-gray-600 font-semibold">{result.generation_time_ms}ms</span> via <span className="text-gray-600 font-semibold">{result.model_used}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyReply}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    style={copied ? {
                      background: 'rgba(16,185,129,0.12)',
                      border: '1px solid rgba(16,185,129,0.35)',
                      color: '#065f46',
                    } : {
                      background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: '#6d28d9',
                    }}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Reply'}</span>
                  </button>
                </div>

                {/* Email Body text */}
                <div
                  className="p-4 rounded-xl text-xs font-mono leading-relaxed whitespace-pre-wrap select-all"
                  style={{
                    background: '#fbfaff',
                    border: '1px solid rgba(139,92,246,0.12)',
                    color: '#1e1b4b',
                  }}
                >
                  {result.suggested_reply}
                </div>
              </div>

              {/* RAG Context Matches (Compact Pill Cards) */}
              {result.retrieved_examples && result.retrieved_examples.length > 0 && (
                <div
                  className="rounded-2xl p-4 sm:p-5 space-y-3"
                  style={{
                    background: 'rgba(255,255,255,0.85)',
                    border: '1px solid rgba(139,92,246,0.18)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: '#4c1d95' }}>
                      <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                      Grounded Enterprise Contexts
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {result.retrieved_examples.length} relevant pairs retrieved
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {result.retrieved_examples.map((ex: RetrievedExample, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl space-y-1"
                        style={{
                          background: '#f8f7ff',
                          border: '1px solid rgba(139,92,246,0.15)',
                        }}
                      >
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="font-semibold text-purple-700">Pair #{idx + 1}</span>
                          <span
                            className="px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background: 'rgba(16,185,129,0.12)',
                              color: '#065f46',
                            }}
                          >
                            {(ex.similarity_score * 100).toFixed(1)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium truncate">
                          "{ex.record.subject}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Dimensional Accuracy Report */}
              {evaluation && (
                <div
                  className="rounded-2xl p-6 space-y-5"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    border: '1px solid rgba(139,92,246,0.22)',
                    boxShadow: '0 4px 20px -4px rgba(124,58,237,0.08)',
                  }}
                >
                  <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'rgba(139,92,246,0.1)' }}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>
                        Empirical Accuracy Evaluation
                      </h3>
                    </div>
                    <ScoreBadge score={evaluation.overall_score} size="md" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    {/* Dial */}
                    <div
                      className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl"
                      style={{
                        background: '#f8f7ff',
                        border: '1px solid rgba(139,92,246,0.12)',
                      }}
                    >
                      <ScoreDial score={evaluation.overall_score} grade={evaluation.quality_grade} />
                      <div className="mt-2 text-center">
                        <span
                          className="inline-block text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full"
                          style={evaluation.safety_gated
                            ? { background: 'rgba(239,68,68,0.1)', color: '#991b1b', border: '1px solid rgba(239,68,68,0.25)' }
                            : { background: 'rgba(16,185,129,0.1)', color: '#065f46', border: '1px solid rgba(16,185,129,0.25)' }
                          }
                        >
                          {evaluation.decision}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bars */}
                    <div className="md:col-span-8 space-y-2.5">
                      {[
                        { label: 'Semantic Alignment', weight: '25%', val: evaluation.scores.semantic_correctness, grad: barColors.semantic },
                        { label: 'Task Resolution',   weight: '25%', val: evaluation.scores.task_completion,      grad: barColors.task },
                        { label: 'Factual Accuracy',  weight: '20%', val: evaluation.scores.key_fact_consistency, grad: barColors.fact },
                        { label: 'Safety & Gating',   weight: '15%', val: evaluation.scores.contradiction_safety, grad: barColors.safety },
                        { label: 'Completeness',      weight: '15%', val: evaluation.scores.completeness,         grad: barColors.complete },
                      ].map(({ label, weight, val, grad }) => (
                        <div key={label} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">
                              {label} <span className="text-gray-400 text-[10px]">({weight})</span>
                            </span>
                            <span className="font-mono font-bold text-gray-900">
                              {(val * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: '#eef2f6' }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${val * 100}%`, background: grad }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
