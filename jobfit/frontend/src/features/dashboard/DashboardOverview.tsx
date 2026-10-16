import React from 'react';
import {
  Briefcase,
  Clock,
  Award,
  Sparkles,
  ArrowRight,
  Upload,
  CheckCircle,
  Shield,
  FileSearch,
} from 'lucide-react';
import type { AIHealth } from '../../lib/types';
import type { NavTab } from '../../components/Sidebar';

interface DashboardOverviewProps {
  aiHealth: AIHealth | null;
  onNavigate: (tab: NavTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  aiHealth,
  onNavigate,
}) => {
  return (
    <div>
      {/* Metrics Row */}
      <div className="metric-grid">
        <div className="metric-card lavender">
          <div className="metric-header">
            <div>
              <div className="metric-title">Tracked Applications</div>
              <div className="metric-value">0</div>
            </div>
            <div className="metric-icon-wrap lavender">
              <Briefcase style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
          <div className="metric-subtext">Active application pipeline</div>
        </div>

        <div className="metric-card lime">
          <div className="metric-header">
            <div>
              <div className="metric-title">In Progress</div>
              <div className="metric-value">0</div>
            </div>
            <div className="metric-icon-wrap lime">
              <Clock style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
          <div className="metric-subtext">Preparing & applied roles</div>
        </div>

        <div className="metric-card pink">
          <div className="metric-header">
            <div>
              <div className="metric-title">Interviews</div>
              <div className="metric-value">0</div>
            </div>
            <div className="metric-icon-wrap pink">
              <Award style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
          <div className="metric-subtext">Active interview rounds</div>
        </div>

        <div className="metric-card blue">
          <div className="metric-header">
            <div>
              <div className="metric-title">AI Engine Status</div>
              <div className="metric-value" style={{ fontSize: '1.45rem', marginTop: '4px' }}>
                {aiHealth?.status === 'ready' ? 'Online' : 'Offline'}
              </div>
            </div>
            <div className="metric-icon-wrap blue">
              <Sparkles style={{ width: '22px', height: '22px' }} />
            </div>
          </div>
          <div className="metric-subtext">
            {aiHealth?.target_model || 'gemma2:2b'} via local Ollama
          </div>
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Quick Start Actions</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Action 1 */}
          <div
            className="card"
            style={{
              cursor: 'pointer',
              borderTop: '4px solid var(--pastel-lavender-dark)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => onNavigate('analyze')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div className="metric-icon-wrap lavender">
                <Sparkles style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Analyze Job Description</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Evidence-backed matching
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Compare target requirements against your resume with citations, gap analysis, and honest tailoring suggestions.
            </p>
            <button className="btn btn-pastel-lavender btn-sm" style={{ width: '100%' }}>
              <span>Start Analysis</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          {/* Action 2 */}
          <div
            className="card"
            style={{
              cursor: 'pointer',
              borderTop: '4px solid var(--pastel-lime-dark)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => onNavigate('resume')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div className="metric-icon-wrap lime">
                <Upload style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Upload & Parse Resume</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  PDF, DOCX, or TXT
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Upload your career document for local structured extraction. Inspect, edit, and curate your skills profile.
            </p>
            <button className="btn btn-pastel-lime btn-sm" style={{ width: '100%' }}>
              <span>Manage Resume</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>

          {/* Action 3 */}
          <div
            className="card"
            style={{
              cursor: 'pointer',
              borderTop: '4px solid var(--pastel-blue-dark)',
              transition: 'all 0.2s ease',
            }}
            onClick={() => onNavigate('applications')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
              <div className="metric-icon-wrap blue">
                <Briefcase style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Application Tracker</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  7-stage local workflow
                </span>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Track submissions from Saved to Offer. Store custom interview notes and export tracker data to CSV.
            </p>
            <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
              <span>View Tracker</span>
              <ArrowRight style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Content Row: Timeline & Privacy */}
      <div className="content-row">
        {/* Left: Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time updates</span>
          </div>

          <div className="empty-state" style={{ padding: '32px 16px' }}>
            <div className="empty-state-icon">
              <FileSearch style={{ width: '32px', height: '32px' }} />
            </div>
            <h3>No Application Activity Yet</h3>
            <p>
              Your analysis timeline and application transitions will appear here once you upload a resume or analyze your first job posting.
            </p>
            <button
              onClick={() => onNavigate('analyze')}
              className="btn btn-primary btn-sm"
            >
              <Sparkles style={{ width: '14px', height: '14px' }} />
              <span>Analyze Your First Job</span>
            </button>
          </div>
        </div>

        {/* Right: Local Privacy Trust Card */}
        <div
          className="card"
          style={{
            background: 'linear-gradient(180deg, #FFFFFF, #FAF9FE)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <Shield style={{ color: 'var(--pastel-lavender-dark)', width: '24px', height: '24px' }} />
              <h3 className="card-title">Privacy Guarantee</h3>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              JobFit runs <strong>100% locally</strong> on your workstation. No career data is ever transmitted to cloud APIs or stored remotely.
            </p>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <CheckCircle style={{ color: '#16A34A', width: '16px', height: '16px', flexShrink: 0 }} />
                <span>Local Gemma 2:2B AI Inference</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <CheckCircle style={{ color: '#16A34A', width: '16px', height: '16px', flexShrink: 0 }} />
                <span>Zero telemetry or resume scraping</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <CheckCircle style={{ color: '#16A34A', width: '16px', height: '16px', flexShrink: 0 }} />
                <span>Zero hallucinations — citations required</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem' }}>
                <CheckCircle style={{ color: '#16A34A', width: '16px', height: '16px', flexShrink: 0 }} />
                <span>Deterministic mathematical scoring</span>
              </li>
            </ul>
          </div>

          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-light)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            Built for Hacktoberfest 2026 • Side Hustle Week
          </div>
        </div>
      </div>
    </div>
  );
};
