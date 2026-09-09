import React, { useState } from 'react';
import { Mail, Sparkles, ShieldCheck, Database, Layers, Menu, X, Zap } from 'lucide-react';

interface NavbarProps {
  activeTab: 'playground' | 'evaluation' | 'calibration' | 'dataset';
  setActiveTab: (tab: 'playground' | 'evaluation' | 'calibration' | 'dataset') => void;
  datasetCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, datasetCount }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'playground',  label: 'AI Generator',              icon: Sparkles,    color: '#7c3aed' },
    { id: 'evaluation',  label: 'Benchmark',                 icon: ShieldCheck,  color: '#6366f1' },
    { id: 'calibration', label: 'Metric Calibration',        icon: Layers,       color: '#0891b2' },
    { id: 'dataset',     label: `Dataset (${datasetCount})`, icon: Database,     color: '#059669' },
  ] as const;

  const handleTabClick = (id: 'playground' | 'evaluation' | 'calibration' | 'dataset') => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-50 transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        boxShadow: '0 2px 20px -6px rgba(124,58,237,0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[68px]">

          {/* ── Logo ── */}
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                boxShadow: '0 4px 14px -4px rgba(124,58,237,0.55)',
              }}
            >
              <Mail className="w-5 h-5 text-white" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className="font-extrabold text-lg tracking-tight leading-none"
                  style={{
                    background: 'linear-gradient(135deg,#6d28d9,#7c3aed,#6366f1)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  EmailGen&nbsp;AI
                </span>
                <span className="hero-badge">v1.0 · RAG</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5 hidden sm:block">
                Enterprise Reply & Multi-Metric Evaluation Engine
              </p>
            </div>
          </div>

          {/* ── Desktop nav ── */}
          <nav
            className="hidden md:flex items-center space-x-1 p-1.5 rounded-2xl"
            style={{
              background: 'rgba(245,243,255,0.8)',
              border: '1px solid rgba(139,92,246,0.15)',
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    isActive ? 'nav-tab-active' : 'nav-tab-inactive'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: isActive ? 'white' : tab.color }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* ── Status pill ── */}
          <div
            className="hidden lg:flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold"
            style={{
              background: 'rgba(16,185,129,0.08)',
              border: '1px solid rgba(16,185,129,0.3)',
              color: '#065f46',
            }}
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Zap className="w-3 h-3" />
            <span className="font-mono">Gemini RAG Active</span>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2.5 rounded-xl transition-colors"
            style={{
              background: 'rgba(139,92,246,0.08)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#7c3aed',
            }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Mobile dropdown ── */}
        {mobileMenuOpen && (
          <div
            className="md:hidden py-3 pb-4 border-t space-y-1"
            style={{ borderColor: 'rgba(139,92,246,0.12)' }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all ${
                    isActive ? 'nav-tab-active' : 'nav-tab-inactive'
                  }`}
                >
                  <Icon className="w-4 h-4" style={{ color: isActive ? 'white' : tab.color }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
};
