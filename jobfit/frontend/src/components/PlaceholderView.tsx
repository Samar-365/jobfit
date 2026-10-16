import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeft } from 'lucide-react';

interface PlaceholderViewProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  phase: string;
  onBack: () => void;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({
  title,
  subtitle,
  description,
  icon: Icon,
  badge,
  phase,
  onBack,
}) => {
  return (
    <div className="card" style={{ maxWidth: '800px', margin: '40px auto', textAlign: 'center', padding: '48px 32px' }}>
      <div
        className="metric-icon-wrap lavender"
        style={{ width: '64px', height: '64px', margin: '0 auto 20px auto' }}
      >
        <Icon style={{ width: '32px', height: '32px' }} />
      </div>

      <span
        style={{
          display: 'inline-block',
          background: 'var(--pastel-lavender)',
          color: 'var(--pastel-lavender-dark)',
          fontSize: '0.78rem',
          fontWeight: 700,
          padding: '4px 12px',
          borderRadius: '9999px',
          marginBottom: '16px',
        }}
      >
        {badge} • Scheduled in {phase}
      </span>

      <h2 style={{ fontSize: '1.6rem', marginBottom: '8px' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '12px', fontWeight: 500 }}>
        {subtitle}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '520px', margin: '0 auto 28px auto' }}>
        {description}
      </p>

      <button onClick={onBack} className="btn btn-secondary">
        <ArrowLeft style={{ width: '16px', height: '16px' }} />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};
