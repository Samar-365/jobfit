import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  Download,
  ShieldCheck,
  AlertCircle,
  Building2,
  Briefcase,
  History,
  Trash2,
  Save,
} from 'lucide-react';
import {
  getResumes,
  generateCoverLetter,
  getCoverLetters,
  updateCoverLetter,
  deleteCoverLetter,
} from '../../lib/api';
import type { ResumeItem, CoverLetterResponse } from '../../lib/types';

interface CoverLetterViewProps {
  initialCompany?: string;
  initialRole?: string;
}

export const CoverLetterView: React.FC<CoverLetterViewProps> = ({
  initialCompany = '',
  initialRole = '',
}) => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');
  const [savedLetters, setSavedLetters] = useState<CoverLetterResponse[]>([]);

  const [company, setCompany] = useState(initialCompany);
  const [roleTitle, setRoleTitle] = useState(initialRole);
  const [jobDescription, setJobDescription] = useState('');
  const [motivationNotes, setMotivationNotes] = useState('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'concise'>('professional');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeLetter, setActiveLetter] = useState<CoverLetterResponse | null>(null);
  const [markdownContent, setMarkdownContent] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resList, letters] = await Promise.all([getResumes(), getCoverLetters()]);
      setResumes(resList);
      if (resList.length > 0) {
        setSelectedResumeId(resList[0].id);
      }
      setSavedLetters(letters);
      if (letters.length > 0 && !activeLetter) {
        setActiveLetter(letters[0]);
        setMarkdownContent(letters[0].content_markdown);
        setCompany(letters[0].company);
        setRoleTitle(letters[0].role_title);
      }
    } catch {
      //
    }
  };

  const handleGenerate = async () => {
    if (!selectedResumeId) {
      setErrorMsg('Please upload or select a resume first.');
      return;
    }
    if (!company.trim() || !roleTitle.trim()) {
      setErrorMsg('Please specify both company and role title.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);

    try {
      const resp = await generateCoverLetter({
        resume_id: selectedResumeId,
        company: company.trim(),
        role_title: roleTitle.trim(),
        job_description: jobDescription.trim() || undefined,
        user_motivation_notes: motivationNotes.trim() || undefined,
        tone,
      });

      setActiveLetter(resp);
      setMarkdownContent(resp.content_markdown);
      setSavedLetters((prev) => [resp, ...prev.filter((l) => l.id !== resp.id)]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate cover letter.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!activeLetter?.id) return;
    setIsSaving(true);
    try {
      const updated = await updateCoverLetter(activeLetter.id, {
        company,
        role_title: roleTitle,
        content_markdown: markdownContent,
      });
      setActiveLetter(updated);
      setSavedLetters((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save cover letter updates.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this cover letter draft?')) return;
    try {
      await deleteCoverLetter(id);
      const remaining = savedLetters.filter((l) => l.id !== id);
      setSavedLetters(remaining);
      if (activeLetter?.id === id) {
        if (remaining.length > 0) {
          setActiveLetter(remaining[0]);
          setMarkdownContent(remaining[0].content_markdown);
        } else {
          setActiveLetter(null);
          setMarkdownContent('');
        }
      }
    } catch {
      //
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const blob = new Blob([markdownContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cover_letter_${company.toLowerCase().replace(/\s+/g, '_')}_${roleTitle.toLowerCase().replace(/\s+/g, '_')}.${format}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Find remaining placeholders
  const remainingPlaceholders = (markdownContent.match(/\[(.*?)\]/g) || []).filter(
    (p) => !p.toLowerCase().includes('http')
  );

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
            fontSize: '0.9rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Generator Configuration Form */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title" style={{ fontSize: '1.4rem' }}>
              Truthful Cover Letter Drafter
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Generates honest cover letter drafts strictly grounded in your resume evidence with explicit bracketed tokens for personal motivation.
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
              fontSize: '0.78rem',
              fontWeight: 700,
            }}
          >
            <ShieldCheck style={{ width: '14px', height: '14px' }} />
            <span>Strict Placeholder Policy</span>
          </div>
        </div>

        {/* Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="form-label">Source Resume Profile</label>
            <select
              className="form-input"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
            >
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.filename} ({r.parsed_data.name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Target Employer</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Stripe, OpenAI, GitHub"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
              <Building2 style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div>
            <label className="form-label">Target Role Title</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Senior Fullstack Engineer"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                style={{ paddingLeft: '36px' }}
              />
              <Briefcase style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: '15px', height: '15px', color: 'var(--text-secondary)' }} />
            </div>
          </div>
        </div>

        {/* Optional Target Job Details */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label">
            Target Job Description Details <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Optional for deeper alignment)</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Paste role requirements or keywords (e.g. distributed systems, FastAPI, microservices)..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {/* Personal Motivation Notes */}
        <div style={{ marginBottom: '16px' }}>
          <label className="form-label">
            Personal Connection / Motivation Notes <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(Optional)</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. I have used Stripe's APIs for 3 years and admire their developer-first documentation."
            value={motivationNotes}
            onChange={(e) => setMotivationNotes(e.target.value)}
          />
        </div>

        {/* Tone Selector & Action Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tone:</span>
            {(['professional', 'enthusiastic', 'concise'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTone(t)}
                className={`btn btn-sm ${tone === t ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '0.78rem', textTransform: 'capitalize' }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedResumeId || !company.trim() || !roleTitle.trim()}
            className="btn btn-primary"
          >
            <Sparkles style={{ width: '15px', height: '15px' }} />
            <span>{isGenerating ? 'Drafting with Gemma 2:2B...' : 'Draft Grounded Cover Letter'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Saved Drafts Area */}
      {markdownContent && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
          <div className="card">
            {/* Editor Top Bar */}
            <div className="card-header" style={{ paddingBottom: '12px' }}>
              <div>
                <h3 className="card-title" style={{ fontSize: '1.25rem' }}>
                  Cover Letter Draft: {company} — {roleTitle}
                </h3>
                {remainingPlaceholders.length > 0 ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--pink-dark)', fontWeight: 600 }}>
                    <AlertCircle style={{ width: '14px', height: '14px' }} />
                    <span>{remainingPlaceholders.length} bracketed token(s) to customize before sending</span>
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '0.82rem', color: 'var(--lime-dark)', fontWeight: 600 }}>
                    <Check style={{ width: '14px', height: '14px' }} />
                    <span>All placeholders filled — ready to send!</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {activeLetter?.id && (
                  <button
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                    className="btn btn-secondary btn-sm"
                  >
                    <Save style={{ width: '13px', height: '13px' }} />
                    <span>{saveSuccess ? 'Saved!' : 'Save Edits'}</span>
                  </button>
                )}

                <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                  {copied ? (
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

                <button onClick={() => handleDownload('md')} className="btn btn-secondary btn-sm">
                  <Download style={{ width: '13px', height: '13px' }} />
                  <span>Download .md</span>
                </button>
              </div>
            </div>

            {/* Markdown Textarea Editor */}
            <textarea
              className="form-textarea"
              rows={16}
              style={{
                fontFamily: 'monospace',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                backgroundColor: 'var(--bg-canvas)',
              }}
              value={markdownContent}
              onChange={(e) => setMarkdownContent(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Saved Drafts List */}
      {savedLetters.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <History style={{ width: '16px', height: '16px', color: 'var(--lavender-dark)' }} />
              <span>Saved Cover Letter Drafts ({savedLetters.length})</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {savedLetters.map((draft) => (
              <div
                key={draft.id}
                onClick={() => {
                  setActiveLetter(draft);
                  setMarkdownContent(draft.content_markdown);
                  setCompany(draft.company);
                  setRoleTitle(draft.role_title);
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.94rem' }}>{draft.role_title}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {draft.company}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    onClick={(e) => draft.id && handleDelete(draft.id, e)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#D32F2F', padding: '4px 8px' }}
                  >
                    <Trash2 style={{ width: '13px', height: '13px' }} />
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
