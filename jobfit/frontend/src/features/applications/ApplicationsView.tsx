import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  Download,
  LayoutGrid,
  List as ListIcon,
  Briefcase,
  Calendar,
  DollarSign,
  Edit2,
  X,
  Check,
  RefreshCw,
} from 'lucide-react';

import type { ApplicationItem, ApplicationStatus } from '../../lib/types';

export const ApplicationsView: React.FC = () => {
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<ApplicationItem | null>(null);

  // Form states for Add / Edit Modal
  const [formData, setFormData] = useState<{
    company: string;
    role: string;
    status: ApplicationStatus;
    applied_date: string;
    salary_range: string;
    match_score: string;
    notes: string;
  }>({
    company: '',
    role: '',
    status: 'Saved',
    applied_date: '',
    salary_range: '',
    match_score: '',
    notes: '',
  });

  const statuses: (ApplicationStatus | 'All')[] = [
    'All',
    'Saved',
    'Preparing',
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
    'Withdrawn',
  ];

  const kanbanColumns: ApplicationStatus[] = [
    'Saved',
    'Preparing',
    'Applied',
    'Interview',
    'Offer',
    'Rejected',
  ];

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/applications');
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Failed to load applications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ApplicationStatus) => {
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setApplications((prev) =>
          prev.map((app) => (app.id === id ? updated : app))
        );
      }
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this tracked application?')) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications((prev) => prev.filter((app) => app.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete application', err);
    }
  };

  const handleOpenAddModal = () => {
    setEditingApp(null);
    setFormData({
      company: '',
      role: '',
      status: 'Saved',
      applied_date: new Date().toISOString().split('T')[0],
      salary_range: '',
      match_score: '',
      notes: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (app: ApplicationItem) => {
    setEditingApp(app);
    setFormData({
      company: app.company,
      role: app.role,
      status: app.status,
      applied_date: app.applied_date || '',
      salary_range: app.salary_range || '',
      match_score: app.match_score !== null && app.match_score !== undefined ? String(app.match_score) : '',
      notes: app.notes || '',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) {
      alert('Company and Role are required.');
      return;
    }

    const payload = {
      company: formData.company.trim(),
      role: formData.role.trim(),
      status: formData.status,
      applied_date: formData.applied_date || null,
      salary_range: formData.salary_range.trim() || null,
      match_score: formData.match_score ? parseFloat(formData.match_score) : null,
      notes: formData.notes.trim() || '',
    };

    try {
      if (editingApp) {
        const res = await fetch(`/api/applications/${editingApp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setApplications((prev) =>
            prev.map((app) => (app.id === editingApp.id ? updated : app))
          );
          setIsAddModalOpen(false);
        }
      } else {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setApplications([created, ...applications]);
          setIsAddModalOpen(false);
        }
      }
    } catch (err) {
      console.error('Failed to save application', err);
    }
  };

  const handleExportCSV = () => {
    window.open('/api/applications/export/csv', '_blank');
  };

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
      case 'Withdrawn':
        return <span className="badge" style={{ backgroundColor: 'var(--bg-subtle)' }}>Withdrawn</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesFilter = filterStatus === 'All' || app.status === filterStatus;
    const matchesSearch =
      app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.notes && app.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header controls bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Status filter tabs */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
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

          {/* Search, view toggles, and actions */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                placeholder="Search role, company, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 12px 8px 36px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.86rem',
                  outline: 'none',
                  minWidth: '220px',
                }}
              />
            </div>

            {/* View Mode Toggle */}
            <div style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <button
                onClick={() => setViewMode('table')}
                title="Table view"
                style={{
                  padding: '7px 10px',
                  border: 'none',
                  background: viewMode === 'table' ? 'var(--pastel-lavender)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <ListIcon style={{ width: '15px', height: '15px' }} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                title="Kanban view"
                style={{
                  padding: '7px 10px',
                  border: 'none',
                  borderLeft: '1px solid var(--border-color)',
                  background: viewMode === 'kanban' ? 'var(--pastel-lavender)' : 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LayoutGrid style={{ width: '15px', height: '15px' }} />
              </button>
            </div>

            {/* Export CSV button */}
            <button
              onClick={handleExportCSV}
              className="btn btn-secondary btn-sm"
              title="Download CSV export of all applications"
            >
              <Download style={{ width: '14px', height: '14px' }} />
              <span>Export CSV</span>
            </button>

            {/* Add Application button */}
            <button
              onClick={handleOpenAddModal}
              className="btn btn-lime btn-sm"
            >
              <Plus style={{ width: '15px', height: '15px' }} />
              <span>Add Application</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main View Area */}
      {loading ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <RefreshCw className="spin" style={{ width: '28px', height: '28px', color: 'var(--text-muted)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading applications from local database...</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company & Role</th>
                <th>Status (Click to change)</th>
                <th>Match Score</th>
                <th>Applied Date</th>
                <th>Target Salary</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Briefcase style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{app.role}</strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {app.company}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getStatusBadge(app.status)}
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        style={{
                          padding: '3px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.78rem',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {statuses.filter((s) => s !== 'All').map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </td>

                  <td>
                    {app.match_score !== null && app.match_score !== undefined ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 700,
                          color: app.match_score >= 80 ? 'var(--pastel-offer-text)' : 'var(--text-primary)',
                          fontSize: '0.94rem',
                        }}
                      >
                        {app.match_score.toFixed(0)}%
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {app.applied_date || '—'}
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {app.salary_range || '—'}
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {app.notes || '—'}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEditModal(app)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--text-muted)',
                          padding: '4px',
                        }}
                        title="Edit application"
                      >
                        <Edit2 style={{ width: '15px', height: '15px' }} />
                      </button>
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
                    </div>
                  </td>
                </tr>
              ))}

              {filteredApps.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px 20px' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No applications found matching your criteria.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* KANBAN BOARD VIEW */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {kanbanColumns.map((colStatus) => {
            const colApps = applications.filter((a) => a.status === colStatus);
            return (
              <div
                key={colStatus}
                style={{
                  backgroundColor: 'var(--bg-canvas)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  minHeight: '400px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{colStatus}</strong>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: 'var(--bg-card)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      {colApps.length}
                    </span>
                  </div>
                </div>

                {colApps.map((app) => (
                  <div
                    key={app.id}
                    className="card"
                    style={{
                      padding: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)', display: 'block' }}>
                          {app.role}
                        </strong>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {app.company}
                        </span>
                      </div>
                      {app.match_score !== null && app.match_score !== undefined && (
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            backgroundColor: 'var(--pastel-lavender)',
                            color: 'var(--text-primary)',
                            padding: '2px 6px',
                            borderRadius: '6px',
                          }}
                        >
                          {app.match_score.toFixed(0)}%
                        </span>
                      )}
                    </div>

                    {app.salary_range && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <DollarSign style={{ width: '13px', height: '13px' }} />
                        <span>{app.salary_range}</span>
                      </div>
                    )}

                    {app.applied_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <Calendar style={{ width: '13px', height: '13px' }} />
                        <span>{app.applied_date}</span>
                      </div>
                    )}

                    {app.notes && (
                      <p
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-secondary)',
                          margin: '4px 0 0',
                          backgroundColor: 'var(--bg-canvas)',
                          padding: '6px 8px',
                          borderRadius: 'var(--radius-sm)',
                          lineHeight: '1.4',
                        }}
                      >
                        {app.notes}
                      </p>
                    )}

                    {/* Quick Move and Edit Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '6px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--border-color)',
                      }}
                    >
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value as ApplicationStatus)}
                        style={{
                          fontSize: '0.76rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                        }}
                      >
                        {statuses.filter((s) => s !== 'All').map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>

                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleOpenEditModal(app)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '2px',
                          }}
                          title="Edit"
                        >
                          <Edit2 style={{ width: '13px', height: '13px' }} />
                        </button>
                        <button
                          onClick={() => handleDelete(app.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            padding: '2px',
                          }}
                          title="Delete"
                        >
                          <Trash2 style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {colApps.length === 0 && (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '30px 10px',
                      color: 'var(--text-muted)',
                      fontSize: '0.82rem',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    No applications in {colStatus}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Application Modal */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '28px',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontFamily: 'var(--font-heading)' }}>
                {editingApp ? 'Edit Application' : 'Log New Application'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveModal} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Role Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Current Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                      backgroundColor: 'white',
                    }}
                  >
                    {statuses.filter((s) => s !== 'All').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Date Applied
                  </label>
                  <input
                    type="date"
                    value={formData.applied_date}
                    onChange={(e) => setFormData({ ...formData, applied_date: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Target Salary Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $140k - $160k"
                    value={formData.salary_range}
                    onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Match Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    value={formData.match_score}
                    onChange={(e) => setFormData({ ...formData, match_score: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Application Notes & Interview Tracking
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Recruiter phone screen scheduled for Thursday at 2pm. Discussed microservices..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.88rem',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-lime btn-sm"
                >
                  <Check style={{ width: '15px', height: '15px' }} />
                  <span>{editingApp ? 'Save Changes' : 'Create Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
