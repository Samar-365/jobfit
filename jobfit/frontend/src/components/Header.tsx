import React from 'react';
import { Menu, Zap, RefreshCw, Shield } from 'lucide-react';
import type { AIHealth } from '../lib/types';

interface HeaderProps {
  title: string;
  subtitle: string;
  aiHealth: AIHealth | null;
  loadingAi: boolean;
  onRefreshAi: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  aiHealth,
  loadingAi,
  onRefreshAi,
  onOpenMobileMenu,
}) => {
  const isReady = aiHealth?.status === 'ready';

  return (
    <header className="top-bar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onOpenMobileMenu}
          className="btn btn-secondary btn-sm"
          style={{ display: 'none', padding: '8px' }}
          id="mobile-menu-trigger"
          aria-label="Open Navigation Menu"
        >
          <Menu style={{ width: '18px', height: '18px' }} />
        </button>

        <div className="page-title">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Local AI Status Pill */}
        <div className="header-ai-badge">
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isReady ? '#22C55E' : '#EF4444',
              boxShadow: isReady ? '0 0 8px #22C55E' : 'none',
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {isReady ? `Gemma (${aiHealth.target_model})` : 'AI Offline'}
          </span>

          {isReady && aiHealth.is_model_running_in_gpu && (
            <span
              style={{
                backgroundColor: 'var(--pastel-lime)',
                color: 'var(--lime-dark)',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '9999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <Zap style={{ width: '11px', height: '11px' }} />
              GPU
            </span>
          )}

          <button
            onClick={onRefreshAi}
            disabled={loadingAi}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
            }}
            title="Refresh Ollama AI Status"
          >
            <RefreshCw
              style={{
                width: '13px',
                height: '13px',
                animation: loadingAi ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>

        {/* Local Privacy Pill */}
        <div
          className="header-ai-badge"
          style={{
            backgroundColor: 'var(--pastel-lavender)',
            borderColor: 'rgba(110, 83, 189, 0.2)',
            color: 'var(--lavender-dark)',
            fontWeight: 600,
          }}
        >
          <Shield style={{ width: '14px', height: '14px' }} />
          <span>Local Only</span>
        </div>
      </div>
    </header>
  );
};
