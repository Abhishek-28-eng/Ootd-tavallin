import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle,
  MoreVertical,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { api } from '../lib/api';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Selected user for modal action
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'role' | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [newRole, setNewRole] = useState('user');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search, roleFilter, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/users', {
        params: {
          page,
          search: search || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          limit: 15,
        },
      });
      return res.data.data;
    },
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ userId, suspend, reason }: { userId: string; suspend: boolean; reason?: string }) => {
      await api.patch(`/admin/users/${userId}/suspend`, { suspend, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedUser(null);
      setActionType(null);
      setSuspensionReason('');
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      await api.patch(`/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setSelectedUser(null);
      setActionType(null);
    },
  });

  const handleOpenSuspend = (user: any) => {
    setSelectedUser(user);
    setActionType('suspend');
    setSuspensionReason(user.suspensionReason || '');
  };

  const handleOpenRole = (user: any) => {
    setSelectedUser(user);
    setActionType('role');
    setNewRole(user.role);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            User Management
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Monitor accounts, assign administrator roles, and regulate community standards.
          </p>
        </div>
        <span className="badge badge-cyan">{data?.pagination?.total ?? 0} Accounts</span>
      </div>

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              color: '#FFFFFF',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: '#FFFFFF',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          <option value="" style={{ background: '#14161F' }}>All Roles</option>
          <option value="user" style={{ background: '#14161F' }}>User</option>
          <option value="moderator" style={{ background: '#14161F' }}>Moderator</option>
          <option value="admin" style={{ background: '#14161F' }}>Admin</option>
          <option value="super_admin" style={{ background: '#14161F' }}>Super Admin</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          style={{
            padding: '10px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            color: '#FFFFFF',
            fontSize: '13px',
            outline: 'none',
          }}
        >
          <option value="" style={{ background: '#14161F' }}>All Statuses</option>
          <option value="active" style={{ background: '#14161F' }}>Active</option>
          <option value="suspended" style={{ background: '#14161F' }}>Suspended</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="admin-table-container glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Posts</th>
              <th>Joined</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Loading community records...
                </td>
              </tr>
            ) : data?.users?.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No accounts found matching filter criteria.
                </td>
              </tr>
            ) : (
              data?.users?.map((u: any) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: 'rgba(212, 175, 55, 0.15)',
                          border: '1px solid rgba(212, 175, 55, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          color: 'var(--accent-gold)',
                          fontSize: '13px',
                          flexShrink: 0,
                        }}
                      >
                        {u.profile?.displayName?.[0] || u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#FFFFFF' }}>{u.profile?.displayName || u.username}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          @{u.username} • {u.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        u.role === 'super_admin'
                          ? 'badge-gold'
                          : u.role === 'admin'
                          ? 'badge-cyan'
                          : u.role === 'moderator'
                          ? 'badge-emerald'
                          : 'badge-gray'
                      }`}
                    >
                      {u.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    {u.isSuspended ? (
                      <span className="badge badge-crimson">Suspended</span>
                    ) : (
                      <span className="badge badge-emerald">Active</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 600 }}>{u.profile?.postsCount || 0}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                      {u.role !== 'super_admin' && (
                        <>
                          <button
                            onClick={() => handleOpenRole(u)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                            title="Change Role"
                          >
                            <Shield size={12} />
                            Role
                          </button>
                          <button
                            onClick={() => handleOpenSuspend(u)}
                            className={u.isSuspended ? 'btn btn-secondary' : 'btn btn-danger'}
                            style={{ padding: '6px 10px', fontSize: '11px' }}
                          >
                            {u.isSuspended ? (
                              <>
                                <CheckCircle size={12} /> Unsuspend
                              </>
                            ) : (
                              <>
                                <Ban size={12} /> Suspend
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ─── Modal: Suspend / Unsuspend ──────────────────────── */}
      {actionType === 'suspend' && selectedUser && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                {selectedUser.isSuspended ? 'Reactivate Account' : 'Suspend Account'}
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {selectedUser.isSuspended
                ? `Restore full access for @${selectedUser.username}. They will be able to post and interact again.`
                : `Suspend @${selectedUser.username}. This will restrict them from posting, liking, and commenting.`}
            </p>

            {!selectedUser.isSuspended && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Suspension Reason (Logged to Audit Record)
                </label>
                <textarea
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  placeholder="e.g. Violation of community standards: repetitive commercial spam"
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
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() =>
                  suspendMutation.mutate({
                    userId: selectedUser.id,
                    suspend: !selectedUser.isSuspended,
                    reason: suspensionReason,
                  })
                }
                className={selectedUser.isSuspended ? 'btn btn-primary' : 'btn btn-danger'}
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending
                  ? 'Saving...'
                  : selectedUser.isSuspended
                  ? 'Confirm Reactivation'
                  : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal: Change Role ──────────────────────────────── */}
      {actionType === 'role' && selectedUser && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                Change User Role
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Update privileges for <strong>@{selectedUser.username}</strong>:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {['user', 'moderator', 'admin'].map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: newRole === r ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    border: newRole === r ? '1px solid rgba(212, 175, 55, 0.3)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 500,
                    textTransform: 'capitalize',
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={newRole === r}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                  <span>{r}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setSelectedUser(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={() => roleMutation.mutate({ userId: selectedUser.id, role: newRole })}
                className="btn btn-primary"
                disabled={roleMutation.isPending}
              >
                {roleMutation.isPending ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
