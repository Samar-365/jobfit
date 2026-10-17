import React, { useState, useEffect } from 'react';
import { Sparkles, Trash2, Calendar, FileText } from 'lucide-react';
import { getAnalyses, deleteAnalysis } from '../../lib/api';
import type { AnalysisItem } from '../../lib/types';

interface SavedAnalysesViewProps {
  onAnalyzeNew: () => void;
}

export const SavedAnalysesView: React.FC<SavedAnalysesViewProps> = ({
  onAnalyzeNew,
}) => {
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisItem | null>(null);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const items = await getAnalyses();
      setAnalyses(items);
    } catch {
      // Backend offline or empty
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved analysis record?')) return;
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    } catch {
      //
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">Saved Job Analyses</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Historical requirement evaluations with evidence logs stored locally in SQLite.
            </p>
          </div>
          <button onClick={onAnalyzeNew} className="btn btn-primary btn-sm">
            <Sparkles style={{ width: '14px', height: '14px' }} />
            <span>Analyze New Job</span>
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading saved analyses...</p>
          </div>
        ) : analyses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 16px' }}>
            <div
              className="empty-state-art"
              style={{ backgroundColor: 'var(--pastel-lavender)', color: 'var(--lavender-dark)', margin: '0 auto 16px auto' }}
            >
              <FileText style={{ width: '32px', height: '32px' }} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Analyses Saved Yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '420px', margin: '0 auto 18px auto' }}>
              Run a match analysis on any target job description to verify alignment with verifiable evidence citations.
            </p>
            <button onClick={onAnalyzeNew} className="btn btn-primary btn-sm">
              <Sparkles style={{ width: '14px', height: '14px' }} />
              <span>Start First Analysis</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {analyses.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAnalysis(selectedAnalysis?.id === item.id ? null : item)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                    {item.role_title}
                  </strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{item.company}</span>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar style={{ width: '12px', height: '12px' }} />
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        color:
                          item.score >= 70
                            ? 'var(--lime-dark)'
                            : item.score >= 45
                            ? 'var(--lavender-dark)'
                            : 'var(--pink-dark)',
                      }}
                    >
                      {Math.round(item.score)}%
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                      {item.match_status_breakdown.EXACT_MATCH || 0} / {item.evidence_items.length} criteria
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#D32F2F', padding: '6px 8px' }}
                    title="Delete analysis"
                  >
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expanded Analysis Drawer / Inspection */}
      {selectedAnalysis && (
        <div className="card" style={{ borderLeft: '6px solid var(--pastel-lavender-dark)' }}>
          <div className="card-header">
            <div>
              <span className="badge badge-applied">{selectedAnalysis.company}</span>
              <h2 className="card-title" style={{ fontSize: '1.35rem', marginTop: '6px' }}>
                {selectedAnalysis.role_title} — Evidence Breakdown
              </h2>
            </div>
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="btn btn-secondary btn-sm"
            >
              Close
            </button>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '16px' }}>
            {selectedAnalysis.summary}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {selectedAnalysis.evidence_items.map((ev, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.86rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong>{ev.requirement_text}</strong>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-pill)',
                      backgroundColor:
                        ev.status === 'EXACT_MATCH'
                          ? 'var(--pastel-lime)'
                          : ev.status === 'PARTIAL_MATCH'
                          ? 'var(--pastel-lavender)'
                          : 'var(--pastel-pink)',
                      color:
                        ev.status === 'EXACT_MATCH'
                          ? 'var(--lime-dark)'
                          : ev.status === 'PARTIAL_MATCH'
                          ? 'var(--lavender-dark)'
                          : 'var(--pink-dark)',
                    }}
                  >
                    {ev.status}
                  </span>
                </div>
                {ev.resume_quote && (
                  <div style={{ fontStyle: 'italic', color: 'var(--text-primary)', margin: '4px 0' }}>
                    "{ev.resume_quote}"
                  </div>
                )}
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                  {ev.reasoning}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
