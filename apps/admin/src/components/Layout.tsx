import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Sparkles,
  ShieldAlert,
  Layers,
  Settings,
  LogOut,
  ExternalLink,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../stores/authContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/users', label: 'Users', icon: Users },
    { to: '/outfits', label: 'Outfits Moderation', icon: Sparkles },
    { to: '/reports', label: 'Reports Queue', icon: ShieldAlert },
    { to: '/taxonomy', label: 'Taxonomy & Styles', icon: Layers },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* ─── Sidebar ────────────────────────────────────────── */}
      <aside
        style={{
          width: '260px',
          borderRight: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 50,
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #D4AF37 0%, #8C6239 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0C0D12',
                fontWeight: 800,
                fontSize: '16px',
                letterSpacing: '1px',
              }}
            >
              T
            </div>
            <div>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 600,
                  letterSpacing: '2px',
                  lineHeight: 1,
                  color: '#FFFFFF',
                }}
              >
                TAVALLIN
              </h1>
              <span
                style={{
                  fontSize: '9px',
                  letterSpacing: '1.5px',
                  fontWeight: 700,
                  color: 'var(--accent-gold)',
                  textTransform: 'uppercase',
                }}
              >
                Ops Console
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(212, 175, 55, 0.25)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} color={isActive ? 'var(--accent-gold)' : 'currentColor'} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System Health Pill */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-emerald)',
                  boxShadow: '0 0 8px var(--accent-emerald)',
                }}
              />
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>API v1.0.0</span>
            </div>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>ONLINE</span>
          </div>
        </div>

        {/* User Footer Profile */}
        <div
          style={{
            padding: '16px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              {user?.displayName?.[0] || 'A'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#FFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.displayName || 'Admin'}
              </p>
              <p style={{ fontSize: '10px', color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {user?.role || 'Super Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ─── Main Content Area ──────────────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          style={{
            height: '64px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'rgba(20, 22, 31, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 40,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Console</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '13px', color: '#FFF', fontWeight: 600, textTransform: 'capitalize' }}>
              {location.pathname === '/' ? 'Overview' : location.pathname.slice(1)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="http://localhost:3000/health"
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Activity size={12} />
              API Health
              <ExternalLink size={10} />
            </a>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};
