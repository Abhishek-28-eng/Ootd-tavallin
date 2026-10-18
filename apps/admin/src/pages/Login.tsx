import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../stores/authContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, tokens } = res.data.data;

      if (!['admin', 'super_admin', 'moderator'].includes(user.role)) {
        setError('Access denied: Administrator privileges required.');
        setLoading(false);
        return;
      }

      login(tokens.accessToken, user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@tavallin.com');
    setPassword('TavallinAdmin@2024!');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#090A0F',
        backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(212, 175, 55, 0.15), transparent)',
        padding: '24px',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '440px',
          padding: '40px',
          position: 'relative',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #D4AF37 0%, #8C6239 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0C0D12',
              fontWeight: 800,
              fontSize: '22px',
              boxShadow: '0 8px 24px rgba(212, 175, 55, 0.3)',
            }}
          >
            T
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              fontWeight: 600,
              letterSpacing: '3px',
              color: '#FFFFFF',
              marginBottom: '6px',
            }}
          >
            TAVALLIN
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>
            Administrative Operations &amp; Moderation
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#FCA5A5',
            }}
          >
            <AlertCircle size={16} flex-shrink={0} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@tavallin.com"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Security Key / Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••••••"
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '6px' }}
          >
            {loading ? (
              'Authenticating...'
            ) : (
              <>
                Access Console
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Quick demo helper */}
        <div
          style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}
        >
          <button
            type="button"
            onClick={fillAdminCredentials}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-gold)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={13} />
            Auto-fill Super Admin Credentials
          </button>
        </div>
      </div>
    </div>
  );
};
