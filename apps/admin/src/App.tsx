import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './stores/authContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UsersPage } from './pages/Users';
import { OutfitsPage } from './pages/Outfits';
import { ReportsPage } from './pages/Reports';
import { TaxonomyPage } from './pages/Taxonomy';
import { SettingsPage } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0C0D12',
          color: 'var(--text-secondary)',
          fontSize: '14px',
        }}
      >
        Authenticating session...
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App(): React.ReactElement {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="outfits" element={<OutfitsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="taxonomy" element={<TaxonomyPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
