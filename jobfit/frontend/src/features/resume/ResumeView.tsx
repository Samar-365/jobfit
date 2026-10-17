import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Edit2,
  Save,
  Plus,
  Shield,
  Trash2,
  RefreshCw,
  AlertCircle,
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Sparkles,
  Calendar,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import {
  getResumes,
  uploadResume,
  updateResume,
  reparseResume,
  deleteResume,
} from '../../lib/api';
import type { ResumeItem, ParsedResume } from '../../lib/types';

interface ResumeViewProps {
  onBack: () => void;
}

export const ResumeView: React.FC<ResumeViewProps> = () => {
  const [resumes, setResumes] = useState<ResumeItem[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'upload'>('profile');
  const [loadingList, setLoadingList] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReparsing, setIsReparsing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Editable profile state
  const [editableProfile, setEditableProfile] = useState<ParsedResume | null>(null);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newSoftSkillInput, setNewSoftSkillInput] = useState('');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch resumes on mount
  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    setLoadingList(true);
    setErrorMsg(null);
    try {
      const items = await getResumes();
      setResumes(items);
      if (items.length > 0) {
        // Select first or previously selected
        const current = items.find((r) => r.id === selectedResumeId) || items[0];
        setSelectedResumeId(current.id);
        setEditableProfile(JSON.parse(JSON.stringify(current.parsed_data)));
        setActiveSubTab('profile');
      } else {
        setSelectedResumeId(null);
        setEditableProfile(null);
        setActiveSubTab('upload');
      }
    } catch {
      setErrorMsg('Could not connect to FastAPI backend. Ensure it is running on port 8000.');
    } finally {
      setLoadingList(false);
    }
  };

  const handleSelectResume = (id: string) => {
    const resume = resumes.find((r) => r.id === id);
    if (resume) {
      setSelectedResumeId(id);
      setEditableProfile(JSON.parse(JSON.stringify(resume.parsed_data)));
      setIsEditing(false);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File exceeds 5MB size limit.');
      return;
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext || '')) {
      setErrorMsg('Unsupported format. Please upload a PDF, DOCX, or TXT document.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);
    setIsUploading(true);
    setUploadStage('Reading file & extracting text...');

    try {
      setTimeout(() => setUploadStage('Running local Gemma 2:2B extraction...'), 800);
      setTimeout(() => setUploadStage('Validating structured schema & saving...'), 2400);

      const newResume = await uploadResume(file);
      setResumes((prev) => [newResume, ...prev]);
      setSelectedResumeId(newResume.id);
      setEditableProfile(JSON.parse(JSON.stringify(newResume.parsed_data)));
      setIsEditing(false);
      setActiveSubTab('profile');
      setSuccessMsg(`"${file.name}" uploaded and parsed successfully!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload and parse resume.');
    } finally {
      setIsUploading(false);
      setUploadStage('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSaveChanges = async () => {
    if (!selectedResumeId || !editableProfile) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const updated = await updateResume(selectedResumeId, editableProfile);
      setResumes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      setEditableProfile(JSON.parse(JSON.stringify(updated.parsed_data)));
      setIsEditing(false);
      setSuccessMsg('Profile updates saved successfully!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReparse = async () => {
    if (!selectedResumeId) return;
    if (!window.confirm('Re-run local Gemma extraction on this resume? Custom edits will be refreshed.')) {
      return;
    }
    setIsReparsing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const refreshed = await reparseResume(selectedResumeId);
      setResumes((prev) => prev.map((r) => (r.id === refreshed.id ? refreshed : r)));
      setEditableProfile(JSON.parse(JSON.stringify(refreshed.parsed_data)));
      setIsEditing(false);
      setSuccessMsg('Resume re-parsed successfully with Gemma!');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to re-parse resume.');
    } finally {
      setIsReparsing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedResumeId) return;
    const activeResume = resumes.find((r) => r.id === selectedResumeId);
    if (!window.confirm(`Permanently delete resume "${activeResume?.filename}" and remove local files?`)) {
      return;
    }

    try {
      await deleteResume(selectedResumeId);
      const remaining = resumes.filter((r) => r.id !== selectedResumeId);
      setResumes(remaining);
      if (remaining.length > 0) {
        setSelectedResumeId(remaining[0].id);
        setEditableProfile(JSON.parse(JSON.stringify(remaining[0].parsed_data)));
      } else {
        setSelectedResumeId(null);
        setEditableProfile(null);
        setActiveSubTab('upload');
      }
      setSuccessMsg('Resume deleted successfully.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete resume.');
    }
  };

  const addSkill = () => {
    if (!newSkillInput.trim() || !editableProfile) return;
    const trimmed = newSkillInput.trim();
    if (!editableProfile.technical_skills.includes(trimmed)) {
      setEditableProfile({
        ...editableProfile,
        technical_skills: [...editableProfile.technical_skills, trimmed],
      });
    }
    setNewSkillInput('');
  };

  const removeSkill = (index: number) => {
    if (!editableProfile) return;
    setEditableProfile({
      ...editableProfile,
      technical_skills: editableProfile.technical_skills.filter((_, i) => i !== index),
    });
  };

  const addSoftSkill = () => {
    if (!newSoftSkillInput.trim() || !editableProfile) return;
    const trimmed = newSoftSkillInput.trim();
    if (!editableProfile.soft_skills.includes(trimmed)) {
      setEditableProfile({
        ...editableProfile,
        soft_skills: [...editableProfile.soft_skills, trimmed],
      });
    }
    setNewSoftSkillInput('');
  };

  const removeSoftSkill = (index: number) => {
    if (!editableProfile) return;
    setEditableProfile({
      ...editableProfile,
      soft_skills: editableProfile.soft_skills.filter((_, i) => i !== index),
    });
  };

  const activeResume = resumes.find((r) => r.id === selectedResumeId);

  return (
    <div style={{ maxWidth: '1020px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Toast Notification Banners */}
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

      {successMsg && (
        <div
          style={{
            padding: '12px 18px',
            backgroundColor: 'var(--pastel-lime)',
            color: 'var(--lime-dark)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #C8E6C9',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.9rem',
          }}
        >
          <CheckCircle2 style={{ width: '18px', height: '18px', flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Header & Sub-navigation Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => setActiveSubTab('profile')}
            disabled={resumes.length === 0}
            className={`btn btn-sm ${activeSubTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <FileText style={{ width: '14px', height: '14px' }} />
            <span>Structured Profile</span>
          </button>
          <button
            onClick={() => setActiveSubTab('upload')}
            className={`btn btn-sm ${activeSubTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Upload style={{ width: '14px', height: '14px' }} />
            <span>Upload Career Document</span>
          </button>
        </div>

        {/* Action Controls for Selected Resume */}
        {activeSubTab === 'profile' && activeResume && editableProfile && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleReparse}
              disabled={isReparsing || isSaving}
              className="btn btn-secondary btn-sm"
              title="Re-run Gemma extraction"
            >
              <RefreshCw
                style={{
                  width: '14px',
                  height: '14px',
                  animation: isReparsing ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{isReparsing ? 'Reparsing...' : 'Reparse'}</span>
            </button>

            {isEditing ? (
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="btn btn-primary btn-sm"
              >
                <Save style={{ width: '14px', height: '14px' }} />
                <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-secondary btn-sm"
              >
                <Edit2 style={{ width: '14px', height: '14px' }} />
                <span>Edit Fields</span>
              </button>
            )}

            <button
              onClick={handleDelete}
              className="btn btn-secondary btn-sm"
              style={{ color: '#D32F2F' }}
              title="Delete resume document"
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
        )}
      </div>

      {/* Resume Document Selector when multiple resumes exist */}
      {resumes.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            Active Resume:
          </span>
          {resumes.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectResume(r.id)}
              style={{
                background: selectedResumeId === r.id ? 'var(--pastel-lavender-dark)' : '#FFFFFF',
                color: selectedResumeId === r.id ? '#FFFFFF' : 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-pill)',
                padding: '4px 14px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {r.filename}
            </button>
          ))}
        </div>
      )}

      {/* Upload Zone Tab */}
      {activeSubTab === 'upload' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Upload Career Document</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                Career documents are stored locally in SQLite and parsed through local Gemma inference. Zero cloud transmission.
              </p>
            </div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: 'var(--pastel-lime)',
                color: 'var(--lime-dark)',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.78rem',
                fontWeight: 700,
              }}
            >
              <Shield style={{ width: '14px', height: '14px' }} />
              <span>100% Offline Processing</span>
            </div>
          </div>

          {/* Hidden native file input */}
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="dropzone"
            style={{
              margin: '20px 0',
              borderColor: isDragging ? 'var(--pastel-lavender-dark)' : 'var(--border-color)',
              backgroundColor: isDragging ? 'var(--pastel-lavender)' : 'transparent',
              transition: 'all 0.2s ease',
            }}
          >
            {isUploading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '24px 0' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '4px solid var(--pastel-lavender)',
                    borderTopColor: 'var(--pastel-lavender-dark)',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Parsing Resume</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{uploadStage}</p>
              </div>
            ) : (
              <>
                <div
                  className="empty-state-art"
                  style={{ backgroundColor: 'var(--pastel-lavender)', color: 'var(--lavender-dark)' }}
                >
                  <Upload style={{ width: '32px', height: '32px' }} />
                </div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
                  Drag and drop your resume here
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '18px' }}>
                  Supported formats: <strong>PDF, DOCX, or TXT</strong> (Max 5MB)
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary btn-sm"
                >
                  <span>Browse Local Files</span>
                </button>
              </>
            )}
          </div>

          <div
            style={{
              padding: '14px 18px',
              backgroundColor: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <CheckCircle2 style={{ width: '16px', height: '16px', color: 'var(--lime-dark)', flexShrink: 0 }} />
            <span>
              JobFit extracts factual text, runs typed schema extraction via Gemma, and lets you inspect and edit every field before analyzing job matches.
            </span>
          </div>
        </div>
      )}

      {/* Structured Profile View Tab */}
      {activeSubTab === 'profile' && (
        <>
          {loadingList ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>Loading stored resume profiles...</p>
            </div>
          ) : !editableProfile ? (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div
                className="empty-state-art"
                style={{ backgroundColor: 'var(--pastel-lavender)', color: 'var(--lavender-dark)', margin: '0 auto 16px auto' }}
              >
                <FileText style={{ width: '32px', height: '32px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Resume Uploaded Yet</h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '440px', margin: '0 auto 20px auto', fontSize: '0.92rem' }}>
                Upload your resume in PDF, DOCX, or TXT format to start extracting competencies and matching against job descriptions.
              </p>
              <button onClick={() => setActiveSubTab('upload')} className="btn btn-primary btn-sm">
                <Upload style={{ width: '14px', height: '14px' }} />
                <span>Upload Your First Resume</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Header Profile Card */}
              <div className="card" style={{ borderLeft: '6px solid var(--pastel-lavender-dark)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
                  <div style={{ flex: 1, minWidth: '260px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-offer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles style={{ width: '12px', height: '12px' }} />
                        <span>Parsed via Gemma 2:2B</span>
                      </span>
                      <span className="badge badge-saved">
                        {activeResume?.filename} ({(activeResume?.file_size_bytes ? activeResume.file_size_bytes / 1024 : 0).toFixed(1)} KB)
                      </span>
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                        <input
                          type="text"
                          className="form-input"
                          style={{ fontSize: '1.3rem', fontWeight: 700 }}
                          placeholder="Candidate Name"
                          value={editableProfile.name}
                          onChange={(e) => setEditableProfile({ ...editableProfile, name: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="Current Role Title"
                            value={editableProfile.title || ''}
                            onChange={(e) => setEditableProfile({ ...editableProfile, title: e.target.value })}
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="Location (e.g. San Francisco, CA)"
                            value={editableProfile.location || ''}
                            onChange={(e) => setEditableProfile({ ...editableProfile, location: e.target.value })}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="Email address"
                            value={editableProfile.email || ''}
                            onChange={(e) => setEditableProfile({ ...editableProfile, email: e.target.value })}
                          />
                          <input
                            type="text"
                            className="form-input"
                            style={{ flex: 1 }}
                            placeholder="Phone number"
                            value={editableProfile.phone || ''}
                            onChange={(e) => setEditableProfile({ ...editableProfile, phone: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : (
                      <>
                        <h2 style={{ fontSize: '1.7rem', marginBottom: '4px' }}>{editableProfile.name}</h2>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', fontWeight: 600, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {editableProfile.title && <span>{editableProfile.title}</span>}
                          {editableProfile.location && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <MapPin style={{ width: '13px', height: '13px' }} />
                              {editableProfile.location}
                            </span>
                          )}
                          {editableProfile.email && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Mail style={{ width: '13px', height: '13px' }} />
                              {editableProfile.email}
                            </span>
                          )}
                          {editableProfile.phone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Phone style={{ width: '13px', height: '13px' }} />
                              {editableProfile.phone}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Professional Summary */}
                <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Professional Summary
                  </div>
                  {isEditing ? (
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={editableProfile.summary || ''}
                      placeholder="Add summary text..."
                      onChange={(e) => setEditableProfile({ ...editableProfile, summary: e.target.value })}
                    />
                  ) : (
                    <p style={{ color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: 1.6 }}>
                      {editableProfile.summary || 'No summary statement extracted from document.'}
                    </p>
                  )}
                </div>
              </div>

              {/* Technical Skills Card */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Code style={{ width: '18px', height: '18px', color: 'var(--lavender-dark)' }} />
                    <span>Technical Skills & Competencies ({editableProfile.technical_skills.length})</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {editableProfile.technical_skills.map((skill, i) => (
                    <span key={i} className="skill-pill match" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>{skill}</span>
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeSkill(i)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--pink-dark)',
                            fontWeight: 700,
                            padding: '0 2px',
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                  {editableProfile.technical_skills.length === 0 && (
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      No technical skills extracted.
                    </span>
                  )}
                </div>

                {isEditing && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px', maxWidth: '340px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Add skill (e.g. Kubernetes)"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSkill();
                        }
                      }}
                    />
                    <button type="button" onClick={addSkill} className="btn btn-secondary btn-sm">
                      <Plus style={{ width: '13px', height: '13px' }} />
                      <span>Add</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Soft Skills Card (if any or if editing) */}
              {(editableProfile.soft_skills.length > 0 || isEditing) && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                      Soft Skills & Leadership ({editableProfile.soft_skills.length})
                    </h3>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {editableProfile.soft_skills.map((skill, i) => (
                      <span key={i} className="skill-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span>{skill}</span>
                        {isEditing && (
                          <button
                            type="button"
                            onClick={() => removeSoftSkill(i)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--pink-dark)',
                              fontWeight: 700,
                              padding: '0 2px',
                            }}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                    {editableProfile.soft_skills.length === 0 && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        No soft skills listed.
                      </span>
                    )}
                  </div>

                  {isEditing && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '14px', maxWidth: '340px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Add soft skill (e.g. Mentorship)"
                        value={newSoftSkillInput}
                        onChange={(e) => setNewSoftSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSoftSkill();
                          }
                        }}
                      />
                      <button type="button" onClick={addSoftSkill} className="btn btn-secondary btn-sm">
                        <Plus style={{ width: '13px', height: '13px' }} />
                        <span>Add</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Work Experience Section */}
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title" style={{ fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Briefcase style={{ width: '18px', height: '18px', color: 'var(--lavender-dark)' }} />
                    <span>Work Experience ({editableProfile.experience.length})</span>
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {editableProfile.experience.map((exp, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--bg-canvas)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '1.02rem', color: 'var(--text-primary)' }}>{exp.role}</strong>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 600 }}>
                            {exp.company} {exp.location ? `• ${exp.location}` : ''}
                          </div>
                        </div>
                        {exp.period && (
                          <span className="badge badge-saved" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Calendar style={{ width: '12px', height: '12px' }} />
                            <span>{exp.period}</span>
                          </span>
                        )}
                      </div>

                      <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                        {exp.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {editableProfile.experience.length === 0 && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      No work experience positions extracted.
                    </p>
                  )}
                </div>
              </div>

              {/* Projects Section (if any) */}
              {editableProfile.projects && editableProfile.projects.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                      Notable Projects ({editableProfile.projects.length})
                    </h3>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    {editableProfile.projects.map((proj, pIdx) => (
                      <div
                        key={pIdx}
                        style={{
                          padding: '16px',
                          backgroundColor: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <strong style={{ fontSize: '0.98rem' }}>{proj.title}</strong>
                        {proj.description && (
                          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '6px 0', lineHeight: 1.4 }}>
                            {proj.description}
                          </p>
                        )}
                        {proj.technologies && proj.technologies.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                            {proj.technologies.map((t, tIdx) => (
                              <span key={tIdx} className="badge badge-saved" style={{ fontSize: '0.72rem' }}>
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education & Certifications Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                {/* Education Card */}
                <div className="card">
                  <h3 className="card-title" style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GraduationCap style={{ width: '18px', height: '18px', color: 'var(--lavender-dark)' }} />
                    <span>Education ({editableProfile.education.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {editableProfile.education.map((edu, eIdx) => (
                      <div
                        key={eIdx}
                        style={{
                          padding: '12px',
                          backgroundColor: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <strong style={{ fontSize: '0.94rem' }}>{edu.institution}</strong>
                        <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                          {edu.degree} {edu.field_of_study ? `in ${edu.field_of_study}` : ''}
                        </div>
                        {edu.graduation_year && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            Graduated: {edu.graduation_year} {edu.gpa ? `• GPA: ${edu.gpa}` : ''}
                          </div>
                        )}
                      </div>
                    ))}
                    {editableProfile.education.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        No education records extracted.
                      </p>
                    )}
                  </div>
                </div>

                {/* Certifications Card */}
                <div className="card">
                  <h3 className="card-title" style={{ fontSize: '1.15rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award style={{ width: '18px', height: '18px', color: 'var(--lime-dark)' }} />
                    <span>Certifications ({editableProfile.certifications.length})</span>
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {editableProfile.certifications.map((cert, cIdx) => (
                      <div
                        key={cIdx}
                        style={{
                          padding: '12px',
                          backgroundColor: 'var(--bg-canvas)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                        }}
                      >
                        <strong style={{ fontSize: '0.94rem' }}>{cert.name}</strong>
                        <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                          {cert.issuer} {cert.year ? `• ${cert.year}` : ''}
                        </div>
                      </div>
                    ))}
                    {editableProfile.certifications.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        No certifications listed.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
