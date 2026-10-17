import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Briefcase,
  Building2,
  FileText,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ArrowLeft,
  Quote,
  Layers,
  CheckCircle2,
  XCircle,
  Edit3,
  Mail,
} from 'lucide-react';
import { getResumes, createAnalysis } from '../../lib/api';
import type { ResumeItem, AnalysisItem, RequirementEvidence } from '../../lib/types';

interface AnalyzeJobViewProps {
  onBack: () => void;
  onNavigateToResume: () => void;
  onNavigateToTailor?: (context: { bullet?: string; context?: string }) => void;
  onNavigateToCoverLetter?: (context: { company?: string; role?: string }) => void;
}

const SAMPLE_JOB_DESCRIPTION = `Stripe — Senior Backend Engineer
Requirements:
- 5+ years of software development experience with Python or Go.
- Proven track record building high-throughput REST APIs and microservices.
- Experience with relational databases such as PostgreSQL or MySQL, including query optimization.
- Strong knowledge of container technologies (Docker, Kubernetes) and CI/CD pipelines.
- Deep commitment to automated testing, code quality, and technical mentorship.

Preferred Qualifications:
- Experience with distributed task queues like Celery, Kafka, or Redis.
- Background in cloud infrastructure deployment on AWS or GCP.
- Familiarity with TypeScript and modern frontend frameworks.`;

export const AnalyzeJobView: React.FC<AnalyzeJobViewProps> = ({
  onBack,
  onNavigateToResume,
  onNavigateToTailor,
  onNavigateToCoverLetter,
}) => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [loadingResumes, setLoadingResumes] = useState<boolean>(true);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStage, setCurrentStage] = useState('Extracting atomic qualifications via Gemma 2:2B...');
  const [analysisResult, setAnalysisResult] = useState<AnalysisItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Results filtering
  const [filterTab, setFilterTab] = useState<'all' | 'exact' | 'partial' | 'not_mentioned'>('all');

  useEffect(() => {
    loadAvailableResumes();
  }, []);

  const loadAvailableResumes = async () => {
    setLoadingResumes(true);
    try {
      const items = await getResumes();
      setResumes(items);
      if (items.length > 0) {
        setSelectedResumeId(items[0].id);
      }
    } catch {
      // Backend not yet reached or no resumes
    } finally {
      setLoadingResumes(false);
    }
  };

  const handleFillSample = () => {
    setCompany('Stripe');
    setRole('Senior Backend Engineer');
    setJobDescription(SAMPLE_JOB_DESCRIPTION);
  };

  const handleRunAnalysis = async () => {
    if (!selectedResumeId) {
      setErrorMsg('Please select or upload a resume first.');
      return;
    }
    if (!jobDescription.trim() || jobDescription.trim().length < 20) {
      setErrorMsg('Please paste a target job description (minimum 20 characters).');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setCurrentStage('Extracting atomic qualifications via Gemma 2:2B...');

    const stageTimer1 = setTimeout(() => {
      setCurrentStage('Correlating verifiable evidence & citations against resume...');
    }, 1200);

    const stageTimer2 = setTimeout(() => {
      setCurrentStage('Computing deterministic match score without hallucinations...');
    }, 2800);

    try {
      const result = await createAnalysis({
        resume_id: selectedResumeId,
        company: company.trim() || 'Target Company',
        role_title: role.trim() || 'Target Role',
        job_description_text: jobDescription.trim(),
      });
      setAnalysisResult(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete analysis.');
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsProcessing(false);
    }
  };

  const getFilteredEvidence = (): RequirementEvidence[] => {
    if (!analysisResult) return [];
    if (filterTab === 'exact') {
      return analysisResult.evidence_items.filter((item) => item.status === 'EXACT_MATCH');
    }
    if (filterTab === 'partial') {
      return analysisResult.evidence_items.filter((item) => item.status === 'PARTIAL_MATCH');
    }
    if (filterTab === 'not_mentioned') {
      return analysisResult.evidence_items.filter((item) => item.status === 'NOT_MENTIONED');
    }
    return analysisResult.evidence_items;
  };

  const selectedResume = resumes.find((r) => r.id === selectedResumeId);

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FFCDD2',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
          }}
        >
          <AlertCircle style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Loading Progress State */}
      {isProcessing && (
        <div className="card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              margin: '0 auto 20px auto',
              borderRadius: '50%',
              border: '4px solid var(--pastel-lavender)',
              borderTopColor: 'var(--pastel-lavender-dark)',
              animation: 'spin 1s linear infinite',
            }}
          />
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Analyzing Resume Against Job</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '520px', margin: '0 auto' }}>
            {currentStage}
          </p>
          <div style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', backgroundColor: 'var(--pastel-lime)', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', fontWeight: 600, color: 'var(--lime-dark)' }}>
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            <span>100% Offline Inference via local Gemma</span>
          </div>
        </div>
      )}

      {/* Input Form Screen */}
      {!analysisResult && !isProcessing && (
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

            {/* Resume Selection */}
            <div style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Candidate Resume</span>
                {resumes.length === 0 && !loadingResumes && (
                  <button
                    onClick={onNavigateToResume}
                    style={{ background: 'none', border: 'none', color: 'var(--lavender-dark)', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
                  >
                    + Upload Resume
                  </button>
                )}
              </label>

              {loadingResumes ? (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Loading resumes...</p>
              ) : resumes.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'var(--bg-canvas)',
                    border: '1px dashed var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText style={{ width: '20px', height: '20px', color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      No resume uploaded yet. Upload one to extract your skills and experience.
                    </span>
                  </div>
                  <button onClick={onNavigateToResume} className="btn btn-primary btn-sm">
                    Upload Resume
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedResumeId}
                    onChange={(e) => setSelectedResumeId(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    {resumes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.filename} ({r.parsed_data.name} — {r.parsed_data.technical_skills.length} skills)
                      </option>
                    ))}
                  </select>
                  <button onClick={onNavigateToResume} className="btn btn-secondary btn-sm" title="Manage resumes">
                    View
                  </button>
                </div>
              )}
            </div>

            {/* Company & Role Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label className="form-label">Company Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Stripe, Linear, Datadog"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Building2
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: 'var(--text-secondary)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Role Title</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Senior Backend Engineer"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                  <Briefcase
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: '16px',
                      height: '16px',
                      color: 'var(--text-secondary)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Job Description Textarea */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Job Description Text
                </label>
                <button
                  type="button"
                  onClick={handleFillSample}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--lavender-dark)',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Load Sample Job Posting
                </button>
              </div>
              <textarea
                className="form-textarea"
                rows={9}
                placeholder="Paste the complete job description, responsibilities, and required qualifications..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>

            {/* Run Analysis Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={handleRunAnalysis}
                disabled={resumes.length === 0 || !jobDescription.trim()}
                className="btn btn-primary"
              >
                <Sparkles style={{ width: '16px', height: '16px' }} />
                <span>Run Evidence Match Analysis</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Screen */}
      {analysisResult && !isProcessing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Top Bar with Re-analyze button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => setAnalysisResult(null)}
                className="btn btn-secondary btn-sm"
              >
                <ArrowLeft style={{ width: '14px', height: '14px' }} />
                <span>Analyze Another Job</span>
              </button>

              {onNavigateToTailor && (
                <button
                  onClick={() =>
                    onNavigateToTailor({
                      context: `${analysisResult.role_title} at ${analysisResult.company}`,
                    })
                  }
                  className="btn btn-secondary btn-sm"
                  title="Rephrase resume bullets for this role"
                >
                  <Edit3 style={{ width: '13px', height: '13px' }} />
                  <span>Tailor Bullets</span>
                </button>
              )}

              {onNavigateToCoverLetter && (
                <button
                  onClick={() =>
                    onNavigateToCoverLetter({
                      company: analysisResult.company,
                      role: analysisResult.role_title,
                    })
                  }
                  className="btn btn-secondary btn-sm"
                  title="Generate grounded cover letter draft"
                >
                  <Mail style={{ width: '13px', height: '13px' }} />
                  <span>Draft Cover Letter</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className="badge badge-offer">
                Analyzed with Gemma 2:2B
              </span>
              <span className="badge badge-saved">
                {selectedResume?.filename}
              </span>
            </div>
          </div>

          {/* Overall Match Summary Card */}
          <div className="card" style={{ borderLeft: '6px solid var(--pastel-lavender-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span className="badge badge-applied" style={{ marginBottom: '6px' }}>
                  {analysisResult.company}
                </span>
                <h1 style={{ fontSize: '1.8rem', marginBottom: '4px' }}>
                  {analysisResult.role_title}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', maxWidth: '640px', lineHeight: 1.5, marginTop: '8px' }}>
                  {analysisResult.summary}
                </p>
              </div>

              {/* Large Deterministic Score Display */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '18px 26px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  minWidth: '170px',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                  Match Alignment
                </div>
                <div
                  style={{
                    fontSize: '2.8rem',
                    fontWeight: 800,
                    color:
                      analysisResult.score >= 70
                        ? 'var(--lime-dark)'
                        : analysisResult.score >= 45
                        ? 'var(--lavender-dark)'
                        : 'var(--pink-dark)',
                    lineHeight: 1.1,
                    margin: '6px 0',
                  }}
                >
                  {Math.round(analysisResult.score)}%
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Deterministic Score
                </div>
              </div>
            </div>

            {/* Score Breakdown Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Must-Have Alignment (70% weight)
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {Math.round(analysisResult.must_have_score)}%
                </div>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Nice-to-Have Alignment (30% weight)
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                  {Math.round(analysisResult.nice_to_have_score)}%
                </div>
              </div>

              <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Evidence Verified
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--lime-dark)', marginTop: '4px' }}>
                  {analysisResult.match_status_breakdown.EXACT_MATCH || 0} / {analysisResult.evidence_items.length} criteria
                </div>
              </div>
            </div>

            {/* Transparent Disclaimer */}
            <div
              style={{
                marginTop: '16px',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 style={{ width: '14px', height: '14px', color: 'var(--lime-dark)', flexShrink: 0 }} />
              <span>
                <strong>Methodology Disclaimer:</strong> {analysisResult.disclaimer} Each score corresponds directly to verified citations from the submitted document.
              </span>
            </div>
          </div>

          {/* Evidence Matrix Section */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers style={{ width: '18px', height: '18px', color: 'var(--lavender-dark)' }} />
                  <span>Evidence Matrix & Citations</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
                  Verbatim quotes cited directly from your resume supporting each qualification requirement.
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  All ({analysisResult.evidence_items.length})
                </button>
                <button
                  onClick={() => setFilterTab('exact')}
                  className={`btn btn-sm ${filterTab === 'exact' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Exact ({analysisResult.match_status_breakdown.EXACT_MATCH || 0})
                </button>
                <button
                  onClick={() => setFilterTab('partial')}
                  className={`btn btn-sm ${filterTab === 'partial' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Partial ({analysisResult.match_status_breakdown.PARTIAL_MATCH || 0})
                </button>
                <button
                  onClick={() => setFilterTab('not_mentioned')}
                  className={`btn btn-sm ${filterTab === 'not_mentioned' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Not Evidenced ({analysisResult.match_status_breakdown.NOT_MENTIONED || 0})
                </button>
              </div>
            </div>

            {/* Evidence Cards List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {getFilteredEvidence().map((item, idx) => {
                const isExact = item.status === 'EXACT_MATCH';
                const isPartial = item.status === 'PARTIAL_MATCH';
                const isNotMentioned = item.status === 'NOT_MENTIONED';

                return (
                  <div
                    key={idx}
                    style={{
                      padding: '18px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      borderLeft: isExact
                        ? '5px solid var(--lime-dark)'
                        : isPartial
                        ? '5px solid var(--lavender-dark)'
                        : '5px solid var(--pink-dark)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-pill)',
                              backgroundColor: item.category.toLowerCase().includes('nice') ? '#E3F2FD' : '#EDE7F6',
                              color: item.category.toLowerCase().includes('nice') ? '#1976D2' : '#5E35B1',
                            }}
                          >
                            {item.category.replace('_', ' ')}
                          </span>
                        </div>
                        <strong style={{ fontSize: '1.02rem', color: 'var(--text-primary)' }}>
                          {item.requirement_text}
                        </strong>
                      </div>

                      {/* Status Pill */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 12px',
                          borderRadius: 'var(--radius-pill)',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          backgroundColor: isExact
                            ? 'var(--pastel-lime)'
                            : isPartial
                            ? 'var(--pastel-lavender)'
                            : 'var(--pastel-pink)',
                          color: isExact
                            ? 'var(--lime-dark)'
                            : isPartial
                            ? 'var(--lavender-dark)'
                            : 'var(--pink-dark)',
                        }}
                      >
                        {isExact && <CheckCircle2 style={{ width: '13px', height: '13px' }} />}
                        {isPartial && <HelpCircle style={{ width: '13px', height: '13px' }} />}
                        {isNotMentioned && <XCircle style={{ width: '13px', height: '13px' }} />}
                        <span>
                          {isExact ? 'Exact Match' : isPartial ? 'Partial Match' : 'Not Evidenced in Document'}
                        </span>
                      </span>
                    </div>

                    {/* Cited Verbatim Resume Quote */}
                    {item.resume_quote && (
                      <div
                        style={{
                          margin: '12px 0 8px 0',
                          padding: '12px 16px',
                          backgroundColor: '#FFFFFF',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--lime-dark)',
                          fontSize: '0.88rem',
                          color: 'var(--text-primary)',
                          fontStyle: 'italic',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '10px',
                        }}
                      >
                        <Quote style={{ width: '16px', height: '16px', color: 'var(--lime-dark)', flexShrink: 0, marginTop: '2px' }} />
                        <span>"{item.resume_quote}"</span>
                      </div>
                    )}

                    {/* Reasoning */}
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '6px 0', lineHeight: 1.5 }}>
                      <strong>Assessment:</strong> {item.reasoning}
                    </p>

                    {/* Actionable recommendation */}
                    {item.recommendation && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '8px 12px',
                          backgroundColor: 'var(--pastel-lavender)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.82rem',
                          color: 'var(--lavender-dark)',
                        }}
                      >
                        <strong>Tip:</strong> {item.recommendation}
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
