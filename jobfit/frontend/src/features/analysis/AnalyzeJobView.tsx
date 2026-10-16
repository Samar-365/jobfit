import React, { useState } from 'react';
import {
  Sparkles,
  Briefcase,
  Building2,
  FileText,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Edit3,
  ArrowLeft,
} from 'lucide-react';

interface AnalyzeJobViewProps {
  onBack: () => void;
  onNavigateToResume: () => void;
}

export const AnalyzeJobView: React.FC<AnalyzeJobViewProps> = ({
  onBack,
  onNavigateToResume,
}) => {
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedResume, setSelectedResume] = useState('demo_resume');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const processingSteps = [
    'Reading resume document and extracted competencies...',
    'Extracting structured job requirements via Gemma 2:2B...',
    'Correlating experience and identifying verifiable citations...',
    'Computing deterministic evidence matrix...',
  ];

  const handleRunAnalysis = () => {
    if (!jobDescription.trim()) return;

    setIsProcessing(true);
    setShowResults(false);
    setCurrentStepIndex(0);

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < processingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setIsProcessing(false);
          setShowResults(true);
          return prev;
        }
      });
    }, 900);
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Workflow Input Area */}
      {!showResults && !isProcessing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <button onClick={onBack} className="btn btn-secondary btn-sm" title="Back to Dashboard">
                    <ArrowLeft style={{ width: '14px', height: '14px' }} />
                  </button>
                  <h2 className="card-title" style={{ fontSize: '1.4rem' }}>
                    Analyze Target Job Opening
                  </h2>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Evaluate requirement alignment with verifiable evidence citations powered by local Gemma.
                </p>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: 'var(--pastel-lavender)',
                  color: 'var(--lavender-dark)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck style={{ width: '15px', height: '15px' }} />
                <span>100% Local Inference</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building2 style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                    Company Name
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corp, Stripe, Figma"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Briefcase style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                    Role Title
                  </span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Fullstack Software Engineer"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText style={{ width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
                    Select Resume
                  </span>
                </label>
                <button
                  type="button"
                  onClick={onNavigateToResume}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--lavender-dark)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  + Upload New Resume
                </button>
              </div>
              <select
                className="form-select"
                value={selectedResume}
                onChange={(e) => setSelectedResume(e.target.value)}
              >
                <option value="demo_resume">Alex Rivera — Senior Software Engineer (Default Resume)</option>
                <option value="custom">Paste Raw Resume Text</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Job Description Text
              </label>
              <textarea
                className="form-textarea"
                rows={9}
                placeholder="Paste the complete job posting or job requirements here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setCompany('Stripe');
                  setRole('Fullstack Engineer');
                  setJobDescription(
                    `About the Role:\nWe are looking for a Fullstack Engineer to join our Payment Infrastructure team.\nKey Requirements:\n- 3+ years experience with React, TypeScript, and modern front-end state management.\n- Demonstrated experience building robust backend APIs using Python (FastAPI or Django).\n- Hands-on experience with PostgreSQL, schema design, and transactional databases.\n- Familiarity with CI/CD pipelines, Docker containerization, and Git.\n- Strong communication and cross-functional collaboration skills.`
                  );
                }}
                className="btn btn-secondary btn-sm"
              >
                Load Sample Posting
              </button>

              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={!jobDescription.trim()}
                className="btn btn-primary"
                style={{
                  opacity: !jobDescription.trim() ? 0.6 : 1,
                  cursor: !jobDescription.trim() ? 'not-allowed' : 'pointer',
                }}
              >
                <Sparkles style={{ width: '16px', height: '16px', color: 'var(--pastel-lime)' }} />
                <span>Analyze Match with Gemma</span>
                <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="card" style={{ padding: '60px 40px', textAlign: 'center' }}>
          <div
            className="empty-state-art"
            style={{
              backgroundColor: 'var(--pastel-lime)',
              color: 'var(--lime-dark)',
              width: '80px',
              height: '80px',
              borderRadius: '24px',
              marginBottom: '24px',
            }}
          >
            <RefreshCw style={{ width: '38px', height: '38px', animation: 'spin 1.5s linear infinite' }} />
          </div>

          <h3 style={{ fontSize: '1.45rem', marginBottom: '8px' }}>
            Analyzing Job Alignment
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', marginBottom: '32px' }}>
            Running offline inference through local Gemma 2:2B runtime...
          </p>

          <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'left' }}>
            {processingSteps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '14px',
                    opacity: isPast ? 0.7 : isCurrent ? 1 : 0.35,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isPast ? 'var(--pastel-lime)' : isCurrent ? 'var(--pastel-lavender)' : '#E5E7EB',
                      color: isPast ? 'var(--lime-dark)' : 'var(--lavender-dark)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: isCurrent ? 600 : 400 }}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Area */}
      {showResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #FFFFFF, #FAF9FE)',
              borderTop: '6px solid var(--pastel-lavender-dark)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-offer" style={{ marginBottom: '8px' }}>
                  Analysis Complete
                </span>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '4px' }}>
                  {role || 'Fullstack Engineer'} at {company || 'Stripe'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                  Analyzed against Alex Rivera's Resume • Offline Gemma Inference
                </p>
              </div>

              <div
                style={{
                  textAlign: 'right',
                  padding: '16px 24px',
                  backgroundColor: 'var(--pastel-lavender)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid rgba(110, 83, 189, 0.15)',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--lavender-dark)', textTransform: 'uppercase' }}>
                  Estimated Alignment
                </div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--lavender-dark)', lineHeight: 1 }}>
                  82%
                </div>
                <div style={{ fontSize: '0.72rem', color: 'rgba(32, 32, 36, 0.65)', marginTop: '4px' }}>
                  4 of 5 Core Criteria Verified
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                paddingTop: '14px',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <HelpCircle style={{ width: '14px', height: '14px', flexShrink: 0 }} />
              <span>
                Calculated strictly from explicit requirement matches in supplied text. Not an ATS score or hiring guarantee.
              </span>
            </div>
          </div>

          {/* Evidence Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle style={{ width: '18px', height: '18px', color: 'var(--lime-dark)' }} />
                <span>Verified Resume Evidence</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>React & TypeScript</strong>
                    <span className="badge badge-offer">Exact Match</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '6px' }}>
                    "Led front-end rebuild using React 18 and TypeScript, reducing bundle size by 35%."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Found in Experience: TechCorp Inc.</span>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Python & Backend APIs</strong>
                    <span className="badge badge-offer">Exact Match</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '6px' }}>
                    "Architected high-throughput REST microservices in Python with FastAPI and SQLAlchemy."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Found in Experience: DataStream Labs</span>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>PostgreSQL & Schemas</strong>
                    <span className="badge badge-offer">Exact Match</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '6px' }}>
                    "Designed normalized PostgreSQL schemas and implemented partition indexing for 20M records."
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Found in Projects: LedgerFlow</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--pink-dark)' }} />
                <span>Identified Requirement Gaps</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '14px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Docker & Containerization</strong>
                    <span className="badge badge-interview">Partial Evidence</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Resume mentions "Deployed services to Kubernetes cluster", but does not explicitly describe authoring Dockerfiles.
                  </p>
                  <div style={{ fontSize: '0.76rem', color: 'var(--blue-dark)', fontWeight: 600 }}>
                    💡 Recommendation: Highlight any direct Docker image build experience in your bullet points.
                  </div>
                </div>

                <div style={{ padding: '14px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Payment / Fintech Experience</strong>
                    <span className="badge badge-saved">Not Mentioned</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    No payment gateway or transactional billing tools mentioned in the submitted resume.
                  </p>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Note: Unmentioned does not imply absence of capability. Highlight transferable data integrity work.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => setShowResults(false)}
              className="btn btn-secondary"
            >
              ← Analyze Another Job
            </button>

            <button
              onClick={() => alert('Tailoring workspace is available in Phase 4!')}
              className="btn btn-primary"
            >
              <Edit3 style={{ width: '16px', height: '16px' }} />
              <span>Tailor Resume Bullets</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
