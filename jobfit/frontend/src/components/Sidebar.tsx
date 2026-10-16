import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Briefcase,
  History,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react';

export type NavTab =
  | 'overview'
  | 'analyze'
  | 'resume'
  | 'applications'
  | 'saved'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpen,
  onClose,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Job', icon: Sparkles },
    { id: 'resume', label: 'My Resume', icon: FileText },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'saved', label: 'Saved Analyses', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sparkles style={{ width: '20px', height: '20px' }} />
        </div>
        <div className="sidebar-logo-text" style={{ flexGrow: 1 }}>
          <h2>JobFit</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="mobile-close-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: isOpen ? 'block' : 'none',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onClose) onClose();
              }}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
              {isActive && <div className="nav-active-pill" />}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--pastel-lime)',
            color: 'var(--lime-dark)',
            padding: '8px 12px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}
        >
          <ShieldCheck style={{ width: '16px', height: '16px', flexShrink: 0 }} />
          <span>Local Gemma Inference</span>
        </div>
      </div>
    </aside>
  );
};
