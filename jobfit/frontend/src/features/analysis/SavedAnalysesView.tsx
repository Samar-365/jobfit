import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface SavedAnalysesViewProps {
  onAnalyzeNew: () => void;
}

export const SavedAnalysesView: React.FC<SavedAnalysesViewProps> = ({
  onAnalyzeNew,
}) => {
  const savedItems = [
    {
      id: 'saved-1',
      company: 'Stripe',
      role: 'Fullstack Engineer',
      date: 'Oct 16, 2026',
      score: 82,
      model: 'gemma2:2b',
      verifiedMatches: 4,
      totalRequirements: 5,
    },
    {
      id: 'saved-2',
      company: 'Figma',
      role: 'Frontend Systems Engineer',
      date: 'Oct 14, 2026',
      score: 78,
      model: 'gemma2:2b',
      verifiedMatches: 3,
      totalRequirements: 4,
    },
  ];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <div>
            <h2 className="card-title">Saved Job Analyses</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Historical requirement evaluations with evidence logs
            </p>
          </div>
          <button onClick={onAnalyzeNew} className="btn btn-primary btn-sm">
            <Sparkles style={{ width: '14px', height: '14px', color: 'var(--pastel-lime)' }} />
            <span>New Analysis</span>
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {savedItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '18px 22px',
                backgroundColor: 'var(--bg-canvas)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div>
                <strong style={{ fontSize: '1.05rem' }}>{item.role}</strong>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '2px' }}>
                  {item.company} • {item.date} • Model: {item.model}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: 'var(--lavender-dark)',
                    }}
                  >
                    {item.score}%
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {item.verifiedMatches}/{item.totalRequirements} Verified
                  </div>
                </div>

                <button onClick={onAnalyzeNew} className="btn btn-secondary btn-sm">
                  <span>View Details</span>
                  <ArrowRight style={{ width: '13px', height: '13px' }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
