import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  };

  const bgColor = theme === 'dark' ? '#0f0f13' : '#ffffff';
  const navBg = theme === 'dark' ? '#15151c' : '#f5f5f5';
  const textColor = theme === 'dark' ? '#e8e8f0' : '#1a1a1a';
  const borderColor = theme === 'dark' ? '#2a2a3a' : '#e0e0e0';

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: bgColor, color: textColor, fontFamily: "'Syne', sans-serif" }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: '56px',
        background: navBg, borderBottom: `1px solid ${borderColor}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#7F77DD' }}>CodeLens AI</span>
          {['/', '/compare', '/history', '/dashboard'].map((path, i) => (
            <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
              fontSize: '14px', fontWeight: 600, color: isActive ? '#7F77DD' : theme === 'dark' ? '#888' : '#666',
              textDecoration: 'none', transition: 'color 0.15s'
            })}>
              {['Editor', 'Compare', 'History', 'Dashboard'][i]}
            </NavLink>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            style={{
              fontSize: '16px', padding: '4px 8px', borderRadius: '6px',
              border: `1px solid ${borderColor}`, background: 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user ? (
            <>
              <span style={{ fontSize: '13px', color: theme === 'dark' ? '#888' : '#666' }}>{user.name || user.email}</span>
              <button onClick={handleLogout} style={{
                fontSize: '13px', padding: '6px 14px', borderRadius: '8px',
                border: `1px solid ${borderColor}`, background: 'transparent',
                color: theme === 'dark' ? '#888' : '#666', cursor: 'pointer'
              }}>Logout</button>
            </>
          ) : (
            <NavLink to="/login" style={{ fontSize: '13px', color: '#7F77DD', textDecoration: 'none', fontWeight: 600 }}>Sign In</NavLink>
          )}
        </div>
      </nav>
      <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
