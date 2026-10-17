import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Upload,
  Cpu,
  CheckCircle2,
  Layers,
  ChevronRight,
} from 'lucide-react';

import type { AIHealth, ApplicationStats, AnalysisItem, ApplicationItem } from '../../lib/types';
import type { NavTab } from '../../components/Sidebar';
import { getApplicationStats, getAnalyses, getApplications } from '../../lib/api';

interface DashboardOverviewProps {
  aiHealth: AIHealth | null;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  aiHealth,
  onNavigate,
}) => {
  const isReady = aiHealth?.status === 'ready';

  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    saved: 0,
    preparing: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
    recent_analyses_count: 0,
  });

  const [recentAnalyses, setRecentAnalyses] = useState<AnalysisItem[]>([]);
  const [recentApps, setRecentApps] = useState<ApplicationItem[]>([]);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsData, analysesData, appsData] = await Promise.all([
          getApplicationStats().catch(() => null),
          getAnalyses().catch(() => []),
          getApplications().catch(() => []),
        ]);

        if (statsData) setStats(statsData);
        if (analysesData) setRecentAnalyses(analysesData.slice(0, 3));
        if (appsData) setRecentApps(appsData.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard metrics', err);
      }
    }
    loadDashboardData();
  }, []);


  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Offer':
        return <span className="badge badge-offer">Offer</span>;
      case 'Interview':
        return <span className="badge badge-interview">Interview</span>;
      case 'Applied':
        return <span className="badge badge-applied">Applied</span>;
      case 'Preparing':
        return <span className="badge badge-preparing">Preparing</span>;
      case 'Saved':
        return <span className="badge badge-saved">Saved</span>;
      case 'Rejected':
        return <span className="badge badge-rejected">Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      {/* 1. Welcome Section with 3D Illustration & Primary CTA */}
      <section className="welcome-hero">
        <div className="welcome-text">
          <div className="welcome-tag">
            <Sparkles style={{ width: '13px', height: '13px' }} />
            <span>AI Career Assistant</span>
          </div>
          <h2>Match your skills truthfully. Keep your data private.</h2>
          <p>
            JobFit analyzes job descriptions against your resume using local Gemma inference.
            Discover evidence-backed matches and honest tailoring recommendations without leaking personal data.
          </p>
          <div className="welcome-actions">
            <button onClick={() => onNavigate('analyze')} className="btn btn-primary">
              <Sparkles style={{ width: '16px', height: '16px', color: 'var(--pastel-lime)' }} />
              <span>Analyze a Job</span>
              <ArrowRight style={{ width: '16px', height: '16px' }} />
            </button>
            <button onClick={() => onNavigate('resume')} className="btn btn-secondary">
              <Upload style={{ width: '16px', height: '16px' }} />
              <span>Upload Resume</span>
            </button>
          </div>
        </div>

        <div className="welcome-illustration">
          <img
            src="/hero.png"
            alt="JobFit 3D Workspace"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </section>

      {/* 2. Summary Cards with Selective Pastel Backgrounds */}
      <div className="metric-grid">
        {/* Card 1: Lavender */}
        <div className="metric-card lavender">
          <div className="metric-top">
            <span className="metric-title">Tracked Applications</span>
            <div className="metric-icon-bubble">
              <Briefcase style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div className="metric-value">{stats.total}</div>
          <div className="metric-subtext">Total applications recorded in SQLite</div>
        </div>

        {/* Card 2: Lime */}
        <div className="metric-card lime">
          <div className="metric-top">
            <span className="metric-title">Active Applications</span>
            <div className="metric-icon-bubble">
              <Clock style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div className="metric-value">{stats.preparing + stats.applied}</div>
          <div className="metric-subtext">{stats.preparing} preparing, {stats.applied} applied</div>
        </div>

        {/* Card 3: Pink */}
        <div className="metric-card pink">
          <div className="metric-top">
            <span className="metric-title">Interviews Scheduled</span>
            <div className="metric-icon-bubble">
              <Award style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div className="metric-value">{stats.interview}</div>
          <div className="metric-subtext">{stats.offer} offer received</div>
        </div>

        {/* Card 4: Powder Blue */}
        <div className="metric-card blue">
          <div className="metric-top">
            <span className="metric-title">Analyses Completed</span>
            <div className="metric-icon-bubble">
              <Layers style={{ width: '18px', height: '18px' }} />
            </div>
          </div>
          <div className="metric-value">{stats.recent_analyses_count}</div>
          <div className="metric-subtext">Evidence-backed Gemma evaluations</div>
        </div>
      </div>

      {/* 3. Main Workspace Row: Recent Analyses / Tracker Preview + Local AI Status Panel */}
      <div className="content-row-2col">
        {/* Left Column: Recent Analyses & Application Pipeline Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Recent Analyses Card */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Recent Job Analyses</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Evidence-backed matching results
                </span>
              </div>
              <button
                onClick={() => onNavigate(recentAnalyses.length > 0 ? 'saved' : 'analyze')}
                className="btn btn-secondary btn-sm"
              >
                <span>{recentAnalyses.length > 0 ? 'View All' : 'New Match'}</span>
                <ArrowRight style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            {recentAnalyses.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentAnalyses.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onNavigate('saved')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {item.role_title}
                      </strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {item.company} • {item.evidence_items.length} qualifications evaluated
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-heading)',
                          color: item.score >= 80 ? 'var(--pastel-offer-text)' : 'var(--text-primary)',
                        }}
                      >
                        {item.score.toFixed(0)}%
                      </span>
                      <ChevronRight style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Helpful Empty State for First-Time Users */
              <div className="empty-state-card">
                <div className="empty-state-art">
                  <Sparkles style={{ width: '32px', height: '32px' }} />
                </div>
                <h4>No Analyses Yet</h4>
                <p>
                  Paste a target job description and match it against your resume to view evidenced skills, gaps, and tailoring advice.
                </p>
                <button
                  onClick={() => onNavigate('analyze')}
                  className="btn btn-lime btn-sm"
                >
                  <span>Run First Analysis</span>
                </button>
              </div>
            )}
          </div>

          {/* Application Pipeline Preview */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Application Pipeline</h3>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Active job application tracker
                </span>
              </div>
              <button
                onClick={() => onNavigate('applications')}
                className="btn btn-secondary btn-sm"
              >
                <span>Open Tracker</span>
              </button>
            </div>

            {recentApps.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentApps.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => onNavigate('applications')}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                        {app.role}
                      </strong>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {app.company} {app.applied_date ? `• ${app.applied_date}` : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(app.status)}
                      {app.match_score !== null && app.match_score !== undefined && (
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {app.match_score.toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-card" style={{ padding: '28px 16px' }}>
                <div
                  className="empty-state-art"
                  style={{ backgroundColor: 'var(--pastel-blue)', color: 'var(--blue-dark)' }}
                >
                  <Briefcase style={{ width: '28px', height: '28px' }} />
                </div>
                <h4>Pipeline Is Clear</h4>
                <p>
                  Track status across Saved, Preparing, Applied, Interview, Offer, and Rejected.
                </p>
                <button
                  onClick={() => onNavigate('applications')}
                  className="btn btn-secondary btn-sm"
                >
                  <span>Add First Application</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Local AI Status Panel & Privacy Guarantees */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Local AI Runtime Card */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu style={{ width: '20px', height: '20px', color: 'var(--text-primary)' }} />
                <h3 className="card-title">Local Gemma AI</h3>
              </div>
              <span
                className={`badge ${isReady ? 'badge-offer' : 'badge-rejected'}`}
              >
                {isReady ? 'Active' : 'Offline'}
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Model</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700 }}>
                  {aiHealth?.target_model || 'gemma2:2b'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Execution</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                  {aiHealth?.is_model_running_in_gpu ? '100% Dedicated GPU' : 'Local CPU'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Latency</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                  {aiHealth?.latency_ms ? `${aiHealth.latency_ms} ms` : 'Localhost'}
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              All parsing, requirement extraction, and bullet tailoring run exclusively on your workstation. No external API keys required.
            </p>
          </div>

          {/* Ethical AI Guarantee Card */}
          <div
            className="card"
            style={{
              background: 'linear-gradient(180deg, #FFFFFF, #FCFBF9)',
              borderTop: '4px solid var(--pastel-lime)',
            }}
          >
            <h4 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 style={{ width: '18px', height: '18px', color: 'var(--lime-dark)' }} />
              <span>Grounding & Truthfulness</span>
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--lime-dark)',
                    marginTop: '7px',
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Verifiable Evidence:</strong> Every positive requirement match cites exact text from your resume.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--lime-dark)',
                    marginTop: '7px',
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Zero Fabrication:</strong> Never invents accomplishments, metrics, employers, or unearned degrees.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--lime-dark)',
                    marginTop: '7px',
                    flexShrink: 0,
                  }}
                />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <strong>Objective Gap Analysis:</strong> Distinguishes unmentioned skills from confirmed lack of capability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
