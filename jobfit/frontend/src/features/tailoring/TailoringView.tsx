import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { getResumes, tailorBullet, updateResume } from '../../lib/api';
import type { ResumeItem, TailoredSuggestion } from '../../lib/types';

interface TailoringViewProps {
  initialBullet?: string;
  initialContext?: string;
}

export const TailoringView: React.FC<TailoringViewProps> = ({
  initialBullet = '',
  initialContext = '',
}) => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [availableBullets, setAvailableBullets] = useState<string[]>([]);

  const [bulletPoint, setBulletPoint] = useState(initialBullet);
  const [jobContext, setJobContext] = useState(initialContext);
  const [style, setStyle] = useState<'action_impact' | 'concise' | 'technical'>('action_impact');

  const [isTailoring, setIsTailoring] = useState(false);
  const [suggestions, setSuggestions] = useState<TailoredSuggestion[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [appliedIndex, setAppliedIndex] = useState<number | null>(null);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const items = await getResumes();
      setResumes(items);
      if (items.length > 0) {
        setSelectedResumeId(items[0].id);
        extractBullets(items[0]);
      }
    } catch {
      //
    }
  };

  const extractBullets = (resume: ResumeItem) => {
    const bullets: string[] = [];
    if (resume.parsed_data?.experience) {
      resume.parsed_data.experience.forEach((exp) => {
        if (exp.bullets) bullets.push(...exp.bullets);
      });
    }
    setAvailableBullets(bullets);
    if (!bulletPoint && bullets.length > 0) {
      setBulletPoint(bullets[0]);
    }
  };

  const handleResumeChange = (resumeId: string) => {
    setSelectedResumeId(resumeId);
    const found = resumes.find((r) => r.id === resumeId);
    if (found) {
      extractBullets(found);
    }
  };

  const handleRunTailoring = async () => {
    if (!bulletPoint.trim() || bulletPoint.trim().length < 10) {
      setErrorMsg('Please select or enter a bullet point of at least 10 characters.');
      return;
    }
    if (!jobContext.trim()) {
      setErrorMsg('Please provide target job context or keywords (e.g. "Senior Backend Engineer, FastAPI").');
      return;
    }

    setErrorMsg(null);
    setIsTailoring(true);
    setSuggestions([]);

    try {
      const resp = await tailorBullet(bulletPoint.trim(), jobContext.trim(), style);
      setSuggestions(resp.suggestions);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to tailor bullet point.');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApplyToResume = async (newText: string, index: number) => {
    const activeResume = resumes.find((r) => r.id === selectedResumeId);
    if (!activeResume) return;

    const updatedProfile = JSON.parse(JSON.stringify(activeResume.parsed_data));
    let replaced = false;

    // Search and replace the original bullet in experiences
    if (updatedProfile.experience) {
      for (const exp of updatedProfile.experience) {
        if (exp.bullets) {
          const bIdx = exp.bullets.indexOf(bulletPoint);
          if (bIdx !== -1) {
            exp.bullets[bIdx] = newText;
            replaced = true;
            break;
          }
        }
      }
    }

    if (replaced) {
      try {
        await updateResume(selectedResumeId, updatedProfile);
        setAppliedIndex(index);
        setBulletPoint(newText);
        setTimeout(() => setAppliedIndex(null), 2500);
      } catch {
        setErrorMsg('Failed to update resume with tailored bullet.');
      }
    } else {
      setErrorMsg('Could not find original bullet in resume to automatically replace. Copied to clipboard instead.');
      navigator.clipboard.writeText(newText);
    }
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: '#FFEBEE',
            color: '#C62828',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FFCDD2',
            fontSize: '0.9rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Main Form Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>
              Truthful Resume Bullet Tailoring
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Rephrase experience bullets to strengthen active verbs and align keywords without fabricating unearned metrics or claims.
            </p>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--pastel-lime)',
              color: 'var(--lime-dark)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-pill)',
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            <span>Anti-Fabrication Guardrails Active</span>
          </div>
        </div>

        {/* Resume Selector */}
        {resumes.length > 1 && (
          <div style={{ marginBottom: '16px' }}>
            <label className="form-label">Active Resume:</label>
            <select
              className="form-input"
              value={selectedResumeId}
              onChange={(e) => handleResumeChange(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename} ({r.parsed_data.name})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Resume Bullet Picker */}
        {availableBullets.length > 0 && (
          <div style={{ marginBottom: '18px' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Pick Bullet From Your Resume:</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {availableBullets.length} bullets found
              </span>
            </label>
            <select
              className="form-input"
              value={bulletPoint}
              onChange={(e) => setBulletPoint(e.target.value)}
            >
              {availableBullets.map((b, i) => (
                <option key={i} value={b}>
                  {b.length > 90 ? `${b.substring(0, 90)}...` : b}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Bullet Textarea */}
        <div style={{ marginBottom: '18px' }}>
          <label className="form-label">Original Bullet Text to Rephrase</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="e.g. Led front-end rebuild using React 18 and TypeScript, reducing bundle size by 35%."
            value={bulletPoint}
            onChange={(e) => setBulletPoint(e.target.value)}
          />
        </div>

        {/* Target Job Context & Style */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '22px' }}>
          <div>
            <label className="form-label">Target Role / Requirement Context</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Senior Backend Engineer, FastAPI, Docker, Microservices"
              value={jobContext}
              onChange={(e) => setJobContext(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Rephrasing Style</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {(
                [
                  { id: 'action_impact', label: 'Action & Impact' },
                  { id: 'concise', label: 'Concise' },
                  { id: 'technical', label: 'Technical Depth' },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStyle(s.id)}
                  className={`btn btn-sm ${style === s.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.8rem' }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={handleRunTailoring}
            disabled={isTailoring || !bulletPoint.trim() || !jobContext.trim()}
            className="btn btn-primary"
          >
            <Sparkles style={{ width: '15px', height: '15px' }} />
            <span>{isTailoring ? 'Rephrasing with Gemma...' : 'Tailor Bullet Point'}</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Tailored Suggestions */}
      {suggestions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.2rem' }}>
              Tailored Suggestions ({suggestions.length})
            </h3>
            <span className="badge badge-offer">Gemma 2:2B Guarded</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {suggestions.map((sugg, i) => (
              <div
                key={i}
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                }}
              >
                {/* Guardrail Status Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Option {i + 1}
                  </span>
                  {sugg.guardrails_passed ? (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--pastel-lime)',
                        color: 'var(--lime-dark)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}
                    >
                      <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                      <span>Factual Core Preserved (0 Fabrications)</span>
                    </span>
                  ) : (
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'var(--pastel-pink)',
                        color: 'var(--pink-dark)',
                        padding: '3px 10px',
                        borderRadius: 'var(--radius-pill)',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                      }}
                    >
                      <AlertTriangle style={{ width: '13px', height: '13px' }} />
                      <span>{sugg.warning || 'Guardrail Alert'}</span>
                    </span>
                  )}
                </div>

                {/* Side-by-Side Diff View */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {/* Original */}
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Original Bullet
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {bulletPoint}
                    </p>
                  </div>

                  {/* Suggested */}
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      borderLeft: '4px solid var(--lime-dark)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--lime-dark)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Tailored Suggestion
                    </div>
                    <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
                      {sugg.suggested_text}
                    </p>
                  </div>
                </div>

                {/* Rationale and Keywords */}
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  <strong>Rationale:</strong> {sugg.rationale}
                  {sugg.aligned_keywords.length > 0 && (
                    <div style={{ display: 'inline-flex', gap: '6px', marginLeft: '12px' }}>
                      {sugg.aligned_keywords.map((kw, kIdx) => (
                        <span key={kIdx} className="badge badge-saved" style={{ fontSize: '0.72rem' }}>
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleCopy(sugg.suggested_text, i)}
                    className="btn btn-secondary btn-sm"
                  >
                    {copiedIndex === i ? (
                      <>
                        <Check style={{ width: '13px', height: '13px', color: 'var(--lime-dark)' }} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy style={{ width: '13px', height: '13px' }} />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleApplyToResume(sugg.suggested_text, i)}
                    className="btn btn-primary btn-sm"
                    disabled={appliedIndex === i}
                  >
                    {appliedIndex === i ? (
                      <>
                        <Check style={{ width: '13px', height: '13px' }} />
                        <span>Saved to Resume!</span>
                      </>
                    ) : (
                      <>
                        <ArrowRight style={{ width: '13px', height: '13px' }} />
                        <span>Apply to Resume</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
