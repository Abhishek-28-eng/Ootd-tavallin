import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layers, Plus, Hash, Tag as TagIcon, X, CheckCircle, Sparkles } from 'lucide-react';
import { api } from '../lib/api';

export const TaxonomyPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('✨');
  const [newCatDescription, setNewCatDescription] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-taxonomy'],
    queryFn: async () => {
      const res = await api.get('/admin/taxonomy');
      return res.data.data;
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (payload: { name: string; slug: string; emoji: string; description: string }) => {
      await api.post('/admin/taxonomy/category', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-taxonomy'] });
      setIsAddModalOpen(false);
      setNewCatName('');
      setNewCatSlug('');
      setNewCatEmoji('✨');
      setNewCatDescription('');
    },
  });

  const handleNameChange = (val: string) => {
    setNewCatName(val);
    setNewCatSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, ''));
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            Style Taxonomy &amp; Tags
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Curate fashion aesthetic categories, discovery classifications, and community hashtag registries.
          </p>
        </div>
        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          <Plus size={16} /> Add Style Category
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Style Categories Grid */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
              Curated Style Archetypes ({data?.categories?.length || 0})
            </h3>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading taxonomies...
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px',
              }}
            >
              {data?.categories?.map((cat: any) => (
                <div
                  key={cat.id}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '24px' }}>{cat.emoji || '✨'}</span>
                    <span className="badge badge-gray">{cat.postsCount || 0} looks</span>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
                      {cat.name}
                    </h4>
                    <span style={{ fontSize: '11px', color: 'var(--accent-gold)', letterSpacing: '0.5px' }}>
                      #{cat.slug}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
                      {cat.description || 'No description entered.'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Trending Hashtags Cloud */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>
              Popular Tags Cloud
            </h3>
          </div>

          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {data?.tags?.map((t: any) => (
                <div
                  key={t.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '12px',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Hash size={11} color="var(--accent-gold)" />
                  <span>{t.slug}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({t.postsCount})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Add Category Modal ──────────────────────────────── */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF' }}>
                Add New Style Category
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCategoryMutation.mutate({
                  name: newCatName,
                  slug: newCatSlug,
                  emoji: newCatEmoji,
                  description: newCatDescription,
                });
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Category Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quiet Luxury"
                  value={newCatName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#FFFFFF',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Emoji
                  </label>
                  <input
                    type="text"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF',
                      fontSize: '14px',
                      textAlign: 'center',
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Slug
                  </label>
                  <input
                    type="text"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--accent-gold)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Description
                </label>
                <textarea
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  placeholder="Aesthetic notes and styling guidance for recommendations"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={createCategoryMutation.isPending}>
                  {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
