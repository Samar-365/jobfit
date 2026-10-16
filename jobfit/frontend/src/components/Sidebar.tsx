import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  Briefcase,
  History,
  Settings,
  ShieldCheck,
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
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'analyze', label: 'Analyze Job', icon: Sparkles },
    { id: 'resume', label: 'My Resume', icon: FileText },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'saved', label: 'Saved Analyses', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Sparkles className="w-5 h-5" />
        </div>
        <div className="sidebar-logo-text">
          <h2>JobFit</h2>
          <span>Local AI Assistant</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '0.78rem' }}>
          <ShieldCheck style={{ color: 'var(--pastel-lime)', width: '16px', height: '16px' }} />
          <span>100% Local & Private</span>
        </div>
      </div>
    </aside>
  );
};
