import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle,
  X,
  Heart,
  Bookmark,
  ExternalLink,
} from 'lucide-react';
import { api } from '../lib/api';

export const OutfitsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-outfits', page, statusFilter],
    queryFn: async () => {
      const res = await api.get('/admin/outfits', {
        params: {
          page,
          status: statusFilter || undefined,
          limit: 12,
        },
      });
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status, note }: { id: string; status: string; note?: string }) => {
      await api.patch(`/admin/outfits/${id}/status`, { status, note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-outfits'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setPreviewPost(null);
    },
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            Outfit Moderation &amp; Curation
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Review user-submitted lookbooks, manage publication status, and maintain visual discovery quality.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'published', 'under_review', 'removed'].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={statusFilter === s ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '6px 14px', fontSize: '12px', textTransform: 'capitalize' }}
            >
              {s ? s.replace('_', ' ') : 'All Statuses'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Outfits */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading lookbook registry...
        </div>
      ) : data?.outfits?.length === 0 ? (
        <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No outfit posts found matching this status filter.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {data?.outfits?.map((post: any) => {
            const firstMedia = post.media?.[0]?.thumbnailUrl || post.media?.[0]?.publicUrl;
            return (
              <div
                key={post.id}
                className="glass-panel"
                style={{
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* Media Image Thumbnail */}
                <div
                  style={{
                    height: '320px',
                    backgroundColor: '#171A26',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {firstMedia ? (
                    <img
                      src={firstMedia}
                      alt={post.caption || 'Outfit'}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                      No Media Attached
                    </div>
                  )}

                  {/* Status Badge overlay */}
                  <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <span
                      className={`badge ${
                        post.status === 'published'
                          ? 'badge-emerald'
                          : post.status === 'under_review'
                          ? 'badge-gold'
                          : 'badge-crimson'
                      }`}
                    >
                      {post.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Likes & Saves Counter pill */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      display: 'flex',
                      gap: '8px',
                    }}
                  >
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Heart size={11} color="var(--accent-crimson)" fill="var(--accent-crimson)" />
                      {post.likesCount || 0}
                    </span>
                    <span
                      style={{
                        padding: '4px 8px',
                        backgroundColor: 'rgba(0,0,0,0.65)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: '#FFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Bookmark size={11} color="var(--accent-gold)" />
                      {post.savesCount || 0}
                    </span>
                  </div>
                </div>

                {/* Post details */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
                        @{post.author?.username || 'user'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        • {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.4,
                        marginBottom: '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {post.caption || 'No caption provided.'}
                    </p>
                  </div>

                  {/* Moderation Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                    <button
                      onClick={() => setPreviewPost(post)}
                      className="btn btn-secondary"
                      style={{ flex: 1, padding: '7px', fontSize: '11px' }}
                    >
                      <Eye size={12} /> Inspect
                    </button>

                    {post.status !== 'published' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: post.id, status: 'published' })}
                        className="btn btn-primary"
                        style={{ padding: '7px 12px', fontSize: '11px' }}
                        title="Approve / Publish"
                      >
                        <CheckCircle size={12} />
                      </button>
                    )}

                    {post.status !== 'removed' && (
                      <button
                        onClick={() => statusMutation.mutate({ id: post.id, status: 'removed', note: 'Removed by moderator' })}
                        className="btn btn-danger"
                        style={{ padding: '7px 12px', fontSize: '11px' }}
                        title="Remove / Unpublish"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Inspect Detail Modal ───────────────────────────── */}
      {previewPost && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '720px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>Lookbook Inspection</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Post ID: {previewPost.id}</span>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Image Preview */}
            <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '20px', backgroundColor: '#000', maxHeight: '420px', display: 'flex', justifyContent: 'center' }}>
              <img
                src={previewPost.media?.[0]?.publicUrl || previewPost.media?.[0]?.thumbnailUrl}
                alt="Post Preview"
                style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain' }}
              />
            </div>

            {/* Author & Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Creator
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFF' }}>
                  @{previewPost.author?.username} ({previewPost.author?.email})
                </span>
              </div>
              <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                  Budget &amp; Currency
                </span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--accent-gold)' }}>
                  {previewPost.budgetMin && previewPost.budgetMax
                    ? `₹${previewPost.budgetMin} – ₹${previewPost.budgetMax}`
                    : 'Unspecified'}
                </span>
              </div>
            </div>

            {/* Caption & Details */}
            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                Full Caption
              </span>
              <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {previewPost.caption || 'No caption provided.'}
              </p>
            </div>

            {/* Clothing Details */}
            {previewPost.clothingDetails && (
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                  Styling Notes &amp; Clothing Items
                </span>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {previewPost.clothingDetails}
                </p>
              </div>
            )}

            {/* Status Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
              <button onClick={() => setPreviewPost(null)} className="btn btn-secondary">
                Close
              </button>
              {previewPost.status !== 'under_review' && (
                <button
                  onClick={() => statusMutation.mutate({ id: previewPost.id, status: 'under_review', note: 'Flagged for content audit' })}
                  className="btn btn-secondary"
                  disabled={statusMutation.isPending}
                >
                  <AlertTriangle size={14} /> Flag for Audit
                </button>
              )}
              {previewPost.status !== 'published' && (
                <button
                  onClick={() => statusMutation.mutate({ id: previewPost.id, status: 'published' })}
                  className="btn btn-primary"
                  disabled={statusMutation.isPending}
                >
                  <CheckCircle size={14} /> Approve &amp; Publish
                </button>
              )}
              {previewPost.status !== 'removed' && (
                <button
                  onClick={() => statusMutation.mutate({ id: previewPost.id, status: 'removed', note: 'Removed via inspection' })}
                  className="btn btn-danger"
                  disabled={statusMutation.isPending}
                >
                  <Trash2 size={14} /> Remove Post
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
