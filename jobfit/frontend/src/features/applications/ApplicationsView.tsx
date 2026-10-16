import React, { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import type { ApplicationStatus } from '../../lib/types';

interface ApplicationRecord {
  id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  date: string;
  matchScore: number;
  notes: string;
}

export const ApplicationsView: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const [applications, setApplications] = useState<ApplicationRecord[]>([
    {
      id: 'app-1',
      company: 'Stripe',
      role: 'Fullstack Engineer',
      status: 'Interview',
      date: 'Oct 14, 2026',
      matchScore: 82,
      notes: 'Technical screen scheduled with payments team on Tuesday.',
    },
    {
      id: 'app-2',
      company: 'Figma',
      role: 'Frontend Systems Engineer',
      status: 'Applied',
      date: 'Oct 12, 2026',
      matchScore: 78,
      notes: 'Applied with tailored resume highlighting React performance rebuild.',
    },
    {
      id: 'app-3',
      company: 'Datadog',
      role: 'Backend Platform Engineer',
      status: 'Preparing',
      date: 'Oct 16, 2026',
      matchScore: 85,
      notes: 'Need to review distributed tracing requirements before submitting.',
    },
    {
      id: 'app-4',
      company: 'Vercel',
      role: 'Developer Experience Engineer',
      status: 'Offer',
      date: 'Oct 08, 2026',
      matchScore: 92,
      notes: 'Offer letter received. Negotiating remote start date.',
    },
  ]);

  const statuses: (ApplicationStatus | 'All')[] = [
    'All',
    'Saved',
    'Preparing',
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
  ];

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'Offer':
        return <span className="badge badge-offer">Offer</span>;
      case 'Interview':
        return <span className="badge badge-interview">Interview</span>;
      case 'Applied':
        return <span className="badge badge-applied">Applied</span>;
      case 'Preparing':
        return <span className="badge badge-preparing">Preparing</span>;
      case 'Saved':
        return <span className="badge badge-saved">Saved</span>;
      case 'Rejected':
        return <span className="badge badge-rejected">Rejected</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesFilter = filterStatus === 'All' || app.status === filterStatus;
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDelete = (id: string) => {
    setApplications(applications.filter((a) => a.id !== id));
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {statuses.map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              >
                <span>{st}</span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '15px',
                  height: '15px',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                placeholder="Search company or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.86rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={() => {
                const companyName = prompt('Enter Company Name:');
                const roleTitle = prompt('Enter Role Title:');
                if (companyName && roleTitle) {
                  setApplications([
                    ...applications,
                    {
                      id: `app-${Date.now()}`,
                      company: companyName,
                      role: roleTitle,
                      status: 'Preparing',
                      date: 'Today',
                      matchScore: 80,
                      notes: 'Application draft created.',
                    },
                  ]);
                }
              }}
              className="btn btn-lime btn-sm"
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>Add Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* Applications Data Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Company & Role</th>
              <th>Status</th>
              <th>Match Alignment</th>
              <th>Date</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredApps.map((app) => (
              <tr key={app.id}>
                <td>
                  <strong style={{ fontSize: '0.94rem' }}>{app.role}</strong>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {app.company}
                  </div>
                </td>
                <td>{getStatusBadge(app.status)}</td>
                <td>
                  <span
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      fontSize: '0.95rem',
                    }}
                  >
                    {app.matchScore}%
                  </span>
                </td>
                <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {app.date}
                </td>
                <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                  {app.notes}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(app.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      padding: '4px',
                    }}
                    title="Delete record"
                  >
                    <Trash2 style={{ width: '15px', height: '15px' }} />
                  </button>
                </td>
              </tr>
            ))}

            {filteredApps.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    No applications found matching the selected filter.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
