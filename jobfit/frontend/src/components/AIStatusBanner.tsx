import React from 'react';
import { RefreshCw, Zap } from 'lucide-react';
import type { AIHealth } from '../lib/types';

interface AIStatusBannerProps {
  health: AIHealth | null;
  loading: boolean;
  onRefresh: () => void;
}

export const AIStatusBanner: React.FC<AIStatusBannerProps> = ({
  health,
  loading,
  onRefresh,
}) => {
  if (loading && !health) {
    return (
      <div className="ai-status-banner" style={{ background: '#F8F9FD' }}>
        <div className="ai-status-info">
          <RefreshCw style={{ width: '18px', height: '18px', color: '#6B7280', animation: 'spin 1s linear infinite' }} />
          <div>
            <strong style={{ fontSize: '0.9rem' }}>Connecting to Local AI Runtime...</strong>
            <p style={{ fontSize: '0.78rem', color: '#6B7280' }}>Checking Ollama server at localhost:11434</p>
          </div>
        </div>
      </div>
    );
  }

  const isReady = health?.status === 'ready';
  const isDegraded = health?.status === 'degraded';

  return (
    <div className={`ai-status-banner ${isReady ? 'ready' : 'unavailable'}`}>
      <div className="ai-status-info">
        <span
          className={`status-dot ${isReady ? 'green pulse' : isDegraded ? 'yellow' : 'red'}`}
        />
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '0.92rem' }}>
              {isReady
                ? `Local Gemma AI Engine: Ready (${health.target_model})`
                : isDegraded
                ? `Local AI Degraded: Model ${health?.target_model} Missing`
                : 'Local AI Offline: Ollama Unreachable'}
            </strong>

            {isReady && health.is_model_running_in_gpu && (
              <span
                style={{
                  background: 'var(--pastel-lime)',
                  color: 'var(--pastel-lime-dark)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Zap style={{ width: '12px', height: '12px' }} />
                GPU Accelerated
              </span>
            )}

            {health?.latency_ms && (
              <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                ({health.latency_ms} ms ping)
              </span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {isReady
              ? 'Private offline inference active. Documents never leave your machine.'
              : health?.error_message || 'Please start Ollama service using `ollama serve`.'}
          </p>
        </div>
      </div>

      <button
        onClick={onRefresh}
        disabled={loading}
        className="btn btn-secondary btn-sm"
        title="Check Ollama connection again"
      >
        <RefreshCw style={{ width: '14px', height: '14px', animation: loading ? 'spin 1s linear infinite' : 'none' }} />
        <span>{loading ? 'Checking...' : 'Refresh AI'}</span>
      </button>
    </div>
  );
};
