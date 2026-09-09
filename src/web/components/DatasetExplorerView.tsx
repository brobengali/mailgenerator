import React, { useState } from 'react';
import { EmailCategory, EmailRecord } from '../../types/index';
import { DatasetLoader } from '../../data/datasetLoader';
import { Database, Search, Tag } from 'lucide-react';

export const DatasetExplorerView: React.FC = () => {
  const allPairs: EmailRecord[] = DatasetLoader.getTrainDataset();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = allPairs.filter((p: EmailRecord) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      p.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.incoming_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.metadata && p.metadata.intent && p.metadata.intent.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Banner & Controls */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(139,92,246,0.2)',
          boxShadow: '0 4px 20px -6px rgba(124,58,237,0.08)',
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold flex items-center gap-2.5" style={{ color: '#1e1b4b' }}>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                  boxShadow: '0 4px 12px -3px rgba(124,58,237,0.4)',
                }}
              >
                <Database className="w-4 h-4 text-white" />
              </div>
              <span
                style={{
                  background: 'linear-gradient(135deg,#5b21b6,#7c3aed,#4f46e5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Historical Email-Reply Knowledge Base ({allPairs.length} Records)
              </span>
            </h2>
            <p className="text-xs text-gray-500 max-w-xl">
              Curated enterprise support email pairs used for Few-Shot RAG retrieval and domain grounding.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search subject or body..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-white border rounded-xl pl-9 pr-3.5 py-2 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 w-48 sm:w-64 transition-all"
                style={{ borderColor: 'rgba(139,92,246,0.25)' }}
              />
            </div>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-white border rounded-xl px-3.5 py-2 text-xs text-purple-900 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
              style={{ borderColor: 'rgba(139,92,246,0.25)' }}
            >
              <option value="all">All Categories ({allPairs.length})</option>
              <option value="technical_support">Technical Support</option>
              <option value="refund_request">Refund Request</option>
              <option value="meeting_scheduling">Meeting Scheduling</option>
              <option value="interview_invitation">Interview Invitation</option>
              <option value="customer_support">Customer Support</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dataset Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((pair: EmailRecord) => (
          <div
            key={pair.id}
            className="p-5 rounded-2xl space-y-3 flex flex-col justify-between transition-all"
            style={{
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(139,92,246,0.18)',
              borderTop: '3px solid #7c3aed',
              boxShadow: '0 2px 12px -2px rgba(124,58,237,0.06)',
            }}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded"
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    color: '#6d28d9',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  {pair.category.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2 text-[11px] font-mono text-gray-400">
                  <span className="capitalize">Tone: {pair.metadata?.tone || 'formal'}</span>
                  <span>•</span>
                  <span className="capitalize">Diff: {pair.metadata?.difficulty || 'medium'}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold leading-tight" style={{ color: '#1e1b4b' }}>
                {pair.subject}
              </h3>

              <div className="space-y-2 text-xs pt-1">
                <div
                  className="p-3 rounded-xl space-y-1"
                  style={{ background: '#f8f7ff', border: '1px solid rgba(139,92,246,0.1)' }}
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                    Incoming Customer Inquiry:
                  </span>
                  <p className="text-gray-700 font-mono text-[11px] leading-relaxed line-clamp-3">
                    {pair.incoming_email}
                  </p>
                </div>

                <div
                  className="p-3 rounded-xl space-y-1"
                  style={{ background: '#f0fdf4', border: '1px solid rgba(16,185,129,0.2)' }}
                >
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                    Sent Expert Response:
                  </span>
                  <p className="text-gray-800 font-mono text-[11px] leading-relaxed line-clamp-3">
                    {pair.reference_reply}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-purple-100 flex flex-wrap items-center gap-1.5">
              <Tag className="w-3 h-3 text-gray-400" />
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-medium"
                style={{
                  background: 'rgba(124,58,237,0.06)',
                  color: '#6d28d9',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                Intent: {pair.metadata?.intent || 'Support'}
              </span>
              {pair.metadata?.key_facts?.names?.map((n: string, idx: number) => (
                <span
                  key={idx}
                  className="text-[10px] font-mono px-2 py-0.5 rounded font-medium"
                  style={{
                    background: 'rgba(8,145,178,0.06)',
                    color: '#0891b2',
                    border: '1px solid rgba(8,145,178,0.15)',
                  }}
                >
                  {n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

