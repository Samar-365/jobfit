import React, { useState } from 'react';
import {
  Cpu,
  Database,
  Trash2,
  Zap,
  RefreshCw,
} from 'lucide-react';
import type { AIHealth } from '../../lib/types';

interface SettingsViewProps {
  aiHealth: AIHealth | null;
  onRefreshAi: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  aiHealth,
  onRefreshAi,
}) => {
  const [selectedModel, setSelectedModel] = useState(aiHealth?.target_model || 'gemma2:2b');
  const [ollamaUrl, setOllamaUrl] = useState(aiHealth?.ollama_url || 'http://localhost:11434');
  const [isPurging, setIsPurging] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);

  const handlePurgeData = async () => {
    if (!window.confirm('CRITICAL ACTION: Are you sure you want to permanently purge all local resumes, job analyses, and application logs? This cannot be undone.')) {
      return;
    }
    setIsPurging(true);
    setPurgeFeedback(null);
    try {
      const res = await fetch('/api/settings/purge-data', { method: 'POST' });
      if (res.ok) {
        setPurgeFeedback('All local data and uploaded files have been permanently wiped.');
      } else {
        setPurgeFeedback('Failed to purge data. Please check backend server.');
      }
    } catch (err) {
      setPurgeFeedback('Error communicating with backend server.');
    } finally {
      setIsPurging(false);
    }
  };


  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* AI Runtime Configuration */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Cpu style={{ width: '22px', height: '22px', color: 'var(--text-primary)' }} />
            <div>
              <h3 className="card-title">Local AI Runtime</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                Manage local Gemma inference engine parameters
              </p>
            </div>
          </div>
          <button onClick={onRefreshAi} className="btn btn-secondary btn-sm">
            <RefreshCw style={{ width: '13px', height: '13px' }} />
            <span>Test Connection</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Active Model</label>
            <select
              className="form-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              <option value="gemma2:2b">gemma2:2b (Recommended • 1.6 GB • High Speed)</option>
              <option value="gemma3:1b">gemma3:1b (Ultra lightweight)</option>
              <option value="qwen3:4b">qwen3:4b</option>
              <option value="phi4-mini:latest">phi4-mini:latest</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ollama Host Address</label>
            <input
              type="text"
              className="form-input"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--bg-canvas)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Zap style={{ width: '18px', height: '18px', color: 'var(--lime-dark)' }} />
            <div>
              <strong style={{ fontSize: '0.9rem' }}>Hardware Acceleration</strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {aiHealth?.is_model_running_in_gpu
                  ? 'NVIDIA GeForce RTX 4050 Laptop GPU (100% offload active)'
                  : 'CPU Execution (GPU offload available)'}
              </div>
            </div>
          </div>
          <span className="badge badge-offer">
            {aiHealth?.status === 'ready' ? 'Active' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Storage and Local Governance */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database style={{ width: '22px', height: '22px', color: 'var(--text-primary)' }} />
            <div>
              <h3 className="card-title">Local Storage & Privacy</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                All career documents are stored strictly on your local disk
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>SQLite Database File</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>jobfit/backend/jobfit.db</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Document Upload Storage</span>
            <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>jobfit/backend/uploads/</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>External Telemetry & Logging</span>
            <span className="badge badge-offer">Disabled (0 Bytes Outbound)</span>
          </div>
        </div>

        <div
          style={{
            padding: '18px',
            backgroundColor: '#FFF5F5',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #FED7D7',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '0.92rem', color: '#C53030' }}>Purge Local Data</strong>
              <p style={{ fontSize: '0.82rem', color: '#742A2A', marginTop: '2px' }}>
                Permanently wipe all stored resumes, application records, and match logs from your workstation.
              </p>
            </div>
            <button
              onClick={handlePurgeData}
              disabled={isPurging}
              className="btn btn-secondary btn-sm"
              style={{ color: '#C53030', borderColor: '#FEB2B2', whiteSpace: 'nowrap' }}
            >
              <Trash2 style={{ width: '14px', height: '14px' }} />
              <span>{isPurging ? 'Purging...' : 'Purge Data'}</span>
            </button>
          </div>

          {purgeFeedback && (
            <div
              style={{
                fontSize: '0.82rem',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'white',
                color: purgeFeedback.includes('permanently') ? '#22543D' : '#C53030',
                border: '1px solid var(--border-color)',
                fontWeight: 600,
              }}
            >
              {purgeFeedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

