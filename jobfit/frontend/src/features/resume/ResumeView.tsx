import React, { useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Edit2,
  Save,
  Plus,
  Shield,
} from 'lucide-react';

interface ResumeViewProps {
  onBack: () => void;
}

export const ResumeView: React.FC<ResumeViewProps> = () => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'upload'>('profile');
  const [isEditing, setIsEditing] = useState(false);

  // Sample parsed resume data
  const [profile, setProfile] = useState({
    name: 'Alex Rivera',
    title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    summary:
      'Fullstack software engineer with 5+ years of experience designing scalable microservices in Python and building modern web applications in React and TypeScript.',
    skills: [
      'Python',
      'FastAPI',
      'React',
      'TypeScript',
      'PostgreSQL',
      'Docker',
      'Kubernetes',
      'SQLAlchemy',
      'Git',
      'REST APIs',
      'Tailwind CSS',
    ],
    experience: [
      {
        company: 'TechCorp Inc.',
        role: 'Senior Fullstack Engineer',
        period: '2022 — Present',
        bullets: [
          'Led front-end rebuild using React 18 and TypeScript, reducing bundle size by 35%.',
          'Architected high-throughput REST microservices in Python with FastAPI and SQLAlchemy.',
          'Mentored 4 junior engineers on clean architecture, unit testing, and code review standards.',
        ],
      },
      {
        company: 'DataStream Labs',
        role: 'Software Engineer',
        period: '2020 — 2022',
        bullets: [
          'Designed normalized PostgreSQL schemas and implemented partition indexing for 20M records.',
          'Automated CI/CD build pipelines with GitHub Actions, cutting deploy time in half.',
        ],
      },
    ],
  });

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Sub-navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('profile')}
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
            <span>Upload New Resume</span>
          </button>
        </div>

        {activeSubTab === 'profile' && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn btn-secondary btn-sm"
          >
            {isEditing ? (
              <>
                <Save style={{ width: '14px', height: '14px' }} />
                <span>Save Changes</span>
              </>
            ) : (
              <>
                <Edit2 style={{ width: '14px', height: '14px' }} />
                <span>Edit Profile</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Upload Zone Tab */}
      {activeSubTab === 'upload' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Upload Career Document</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                Files are stored locally in SQLite and parsed with local Gemma inference.
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
              <span>Offline Processing</span>
            </div>
          </div>

          <div className="dropzone" style={{ margin: '20px 0' }}>
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
            <button className="btn btn-primary btn-sm">
              <span>Browse Local Files</span>
            </button>
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
              Resumes are parsed into typed Pydantic models. You can review and adjust any field before running match evaluations.
            </span>
          </div>
        </div>
      )}

      {/* Structured Profile View Tab */}
      {activeSubTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Card */}
          <div className="card" style={{ borderLeft: '6px solid var(--pastel-lavender-dark)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-offer" style={{ marginBottom: '8px' }}>
                  Parsed via Gemma 2:2B
                </span>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '2px' }}>{profile.name}</h2>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', fontWeight: 600 }}>
                  {profile.title} • {profile.location}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="badge badge-saved">alex_rivera_resume.pdf</span>
              </div>
            </div>

            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                Professional Summary
              </div>
              {isEditing ? (
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={profile.summary}
                  onChange={(e) => setProfile({ ...profile, summary: e.target.value })}
                />
              ) : (
                <p style={{ color: 'var(--text-primary)', fontSize: '0.94rem', lineHeight: 1.6 }}>
                  {profile.summary}
                </p>
              )}
            </div>
          </div>

          {/* Skills Grid Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title" style={{ fontSize: '1.15rem' }}>
                Extracted Skills & Competencies ({profile.skills.length})
              </h3>
              {isEditing && (
                <button className="btn btn-secondary btn-sm">
                  <Plus style={{ width: '13px', height: '13px' }} />
                  <span>Add Skill</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {profile.skills.map((skill, i) => (
                <span key={i} className="skill-pill match">
                  <span>{skill}</span>
                  {isEditing && (
                    <button
                      onClick={() =>
                        setProfile({
                          ...profile,
                          skills: profile.skills.filter((_, idx) => idx !== i),
                        })
                      }
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pink-dark)' }}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Experience Cards */}
          <div className="card">
            <h3 className="card-title" style={{ fontSize: '1.15rem', marginBottom: '18px' }}>
              Work Experience
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {profile.experience.map((exp, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '18px',
                    backgroundColor: 'var(--bg-canvas)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '1rem' }}>{exp.role}</strong>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                        {exp.company}
                      </div>
                    </div>
                    <span className="badge badge-saved">{exp.period}</span>
                  </div>

                  <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {exp.bullets.map((b, bIdx) => (
                      <li key={bIdx} style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
