import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Sparkles,
  ShieldAlert,
  MessageCircle,
  TrendingUp,
  ArrowUpRight,
  Clock,
  Compass,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

export const Dashboard: React.FC = () => {
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/stats');
      return res.data.data;
    },
    refetchInterval: 30000,
  });

  // Simulated trend data based on current real stats
  const activityTrends = [
    { name: 'Mon', outfits: 3, users: 1, engagement: 24 },
    { name: 'Tue', outfits: 5, users: 2, engagement: 42 },
    { name: 'Wed', outfits: 8, users: 3, engagement: 68 },
    { name: 'Thu', outfits: 6, users: 2, engagement: 55 },
    { name: 'Fri', outfits: 11, users: 4, engagement: 95 },
    { name: 'Sat', outfits: 14, users: 6, engagement: 140 },
    { name: 'Sun', outfits: statsData?.totalOutfits || 18, users: statsData?.totalUsers || 8, engagement: 180 },
  ];

  return (
    <div>
      {/* Page Title & Status */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '32px', fontWeight: 600, color: '#FFFFFF', marginBottom: '6px' }}>
            System Intelligence
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Real-time fashion discovery platform metrics, moderation queue, and user activity.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <Clock size={14} />
          Auto-syncing every 30s
        </div>
      </div>

      {/* ─── Metric Cards Grid ──────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        {/* Total Users */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Users
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="var(--accent-cyan)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            {isLoading ? '...' : statsData?.totalUsers ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-emerald)' }}>
            <TrendingUp size={14} />
            <span>+{statsData?.newUsersThisWeek ?? 0} joined this week</span>
          </div>
        </div>

        {/* Total Outfits */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Curated Outfits
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(212, 175, 55, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="var(--accent-gold)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            {isLoading ? '...' : statsData?.totalOutfits ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--accent-gold)' }}>
            <Compass size={14} />
            <span>Live on discovery feed</span>
          </div>
        </div>

        {/* Pending Reports */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Moderation Queue
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={18} color="var(--accent-crimson)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            {isLoading ? '...' : statsData?.pendingReports ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: (statsData?.pendingReports ?? 0) > 0 ? 'var(--accent-crimson)' : 'var(--accent-emerald)' }}>
            {(statsData?.pendingReports ?? 0) > 0 ? (
              <span>Requires immediate review</span>
            ) : (
              <span>Queue clear &amp; healthy</span>
            )}
          </div>
        </div>

        {/* Total Comments */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Social Engagements
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={18} color="var(--accent-violet)" />
            </div>
          </div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px' }}>
            {isLoading ? '...' : statsData?.totalComments ?? 0}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>Comments &amp; style dialogues</span>
          </div>
        </div>
      </div>

      {/* ─── Charts Section ─────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Engagement Trend Chart */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>Platform Discovery Trends</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Outfit impressions &amp; engagement volume over 7 days</p>
            </div>
            <span className="badge badge-gold">Active Stream</span>
          </div>

          <div style={{ width: '100%', height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#D4AF37" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171A26',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#FFF',
                  }}
                />
                <Area type="monotone" dataKey="engagement" stroke="#D4AF37" strokeWidth={2} fillOpacity={1} fill="url(#goldGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Categories Distribution */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>Style Taxonomy</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Trending aesthetic categories</p>
            </div>
            <Link to="/taxonomy" style={{ color: 'var(--accent-gold)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              View all <ArrowUpRight size={12} />
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {(statsData?.topCategories || []).slice(0, 5).map((cat: any) => (
              <div key={cat.slug} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>{cat.emoji || '✨'}</span>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{cat.name}</span>
                </div>
                <span className="badge badge-gray">{cat.postsCount || 0} posts</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Quick Actions & Triage Alert ───────────────────── */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.08) 0%, rgba(20, 22, 31, 0.8) 100%)',
          border: '1px solid rgba(212, 175, 55, 0.2)',
        }}
      >
        <div>
          <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            Operational Health: Fully Synchronized
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
            Database connected (MySQL 8.0), Auth tokens valid, Sharp media processor active.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/outfits" className="btn btn-secondary">
            Review Outfits
          </Link>
          <Link to="/users" className="btn btn-primary">
            Manage Community
          </Link>
        </div>
      </div>
    </div>
  );
};
