import React, { useState } from 'react';
import { Sliders, Database, HardDrive, Shield, Bell, CheckCircle2, Cpu } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [featurePush, setFeaturePush] = useState(false);
  const [featureEmail, setFeatureEmail] = useState(false);
  const [featureWeather, setFeatureWeather] = useState(true);
  const [featureStylist, setFeatureStylist] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '30px', fontWeight: 600, color: '#FFFFFF', marginBottom: '4px' }}>
            Platform Configuration
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            System infrastructure parameters, feature flags, storage pipelines, and rate limiting policies.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Environment & Database Details */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Database size={18} color="var(--accent-gold)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>Infrastructure &amp; Database</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Primary Database
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                MySQL 8.0 @ localhost:3306
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent-emerald)', display: 'block', marginTop: '4px' }}>
                tavallin_dev (Connected)
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Storage Pipeline
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                Local Static + Sharp WebP
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                Base: http://localhost:3000/uploads
              </span>
            </div>

            <div style={{ padding: '14px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                Security &amp; Hashing
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                Argon2id + HMAC-SHA256 JWT
              </span>
              <span style={{ fontSize: '11px', color: 'var(--accent-gold)', display: 'block', marginTop: '4px' }}>
                Access: 15m / Refresh: 7d
              </span>
            </div>
          </div>
        </div>

        {/* Feature Flags */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF' }}>Active Feature Toggles</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', display: 'block' }}>
                  AI Stylist &amp; Color Harmony Matrix
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Enables algorithmic outfit pairing and tone-on-tone recommendations
                </span>
              </div>
              <input
                type="checkbox"
                checked={featureStylist}
                onChange={(e) => setFeatureStylist(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', display: 'block' }}>
                  Weather Contextual Outfit Suggestions
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Filters discovery looks dynamically matching user climate / temperature
                </span>
              </div>
              <input
                type="checkbox"
                checked={featureWeather}
                onChange={(e) => setFeatureWeather(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
              />
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                cursor: 'pointer',
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', display: 'block' }}>
                  Mobile Push Notifications Dispatch
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Sends APNs / FCM push notifications on likes, comments, and follows
                </span>
              </div>
              <input
                type="checkbox"
                checked={featurePush}
                onChange={(e) => setFeaturePush(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          {saved && (
            <span style={{ fontSize: '13px', color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Configuration saved
            </span>
          )}
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
};
