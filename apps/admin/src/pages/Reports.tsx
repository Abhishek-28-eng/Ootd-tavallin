import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, CheckCircle, XCircle, Clock, Filter, MessageSquare, AlertTriangle, X } from 'lucide-react';
import { api } from '../lib/api';

export const ReportsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);

  // Selected report for resolution modal
  const [activeReport, setActiveReport] = useState<any | null>(null);
  const [actionStatus, setActionStatus] = useState<'resolved' | 'dismissed'>('resolved');
  const [moderationNote, setModerationNote] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/reports', {
        params: {
          page,
          status: statusFilter || undefined,
          limit: 15,
        },
      });
      return res.data.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note: string }) => {
      await api.patch(`/admin/reports/${id}/resolve`, {
        status,
        moderationNote: note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setActiveReport(null);
      setModerationNote('');
    },
  });

  const handleOpenResolve = (report: any, status: 'resolved' | 'dismissed') => {
    setActiveReport(report);
    setActionStatus(status);
    setModerationNote('');
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            Content Reports &amp; Safety Queue
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Investigate community flags for spam, intellectual property, copyright, and policy violations.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'pending', 'resolved', 'dismissed'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={statusFilter === s ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '12px', textTransform: 'capitalize' }}
            >
              {s || 'All Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="admin-table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Target Type</th>
              <th>Category</th>
              <th>Flagged Description</th>
              <th>Reporter</th>
              <th>Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Resolution</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading safety queue...
                </td>
              </tr>
            ) : data?.reports?.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                  <ShieldAlert size={28} color="var(--accent-emerald)" style={{ margin: '0 auto 8px', display: 'block' }} />
                  No reports currently require action in this category.
                </td>
              </tr>
            ) : (
              data?.reports?.map((r: any) => (
                <tr key={r.id}>
                  <td>
                    <span
                      className={`badge ${
                        r.targetType === 'outfit'
                          ? 'badge-gold'
                          : r.targetType === 'user'
                          ? 'badge-cyan'
                          : 'badge-gray'
                      }`}
                    >
                      {r.targetType}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#FFFFFF', textTransform: 'capitalize' }}>
                      {r.category.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ maxWidth: '280px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {r.description || 'No additional commentary.'}
                    </p>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    @{r.reporter?.username || 'user'}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.status === 'pending'
                          ? 'badge-crimson'
                          : r.status === 'resolved'
                          ? 'badge-emerald'
                          : 'badge-gray'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {r.status === 'pending' ? (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          onClick={() => handleOpenResolve(r, 'resolved')}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <CheckCircle size={12} /> Resolve
                        </button>
                        <button
                          onClick={() => handleOpenResolve(r, 'dismissed')}
                          className="btn btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px' }}
                        >
                          <XCircle size={12} /> Dismiss
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {r.moderationNote || 'Closed'}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Resolution Modal ───────────────────────────────── */}
      {activeReport && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                {actionStatus === 'resolved' ? 'Resolve Report' : 'Dismiss Report'}
              </h3>
              <button
                onClick={() => setActiveReport(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)', marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Target: {activeReport.targetType.toUpperCase()} ({activeReport.targetId})
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent-gold)', marginBottom: '4px' }}>
                Violation: {activeReport.category.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {activeReport.description || 'No user commentary.'}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Resolution / Moderation Audit Note
              </label>
              <textarea
                value={moderationNote}
                onChange={(e) => setModerationNote(e.target.value)}
                placeholder={
                  actionStatus === 'resolved'
                    ? 'e.g., Content inspected, warning issued, item unpublished.'
                    : 'e.g., Target inspected and verified compliant with guidelines.'
                }
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setActiveReport(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() =>
                  resolveMutation.mutate({
                    id: activeReport.id,
                    status: actionStatus,
                    note: moderationNote,
                  })
                }
                className={actionStatus === 'resolved' ? 'btn btn-primary' : 'btn btn-secondary'}
                disabled={resolveMutation.isPending}
              >
                {resolveMutation.isPending
                  ? 'Submitting...'
                  : actionStatus === 'resolved'
                  ? 'Confirm Resolution'
                  : 'Dismiss Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
