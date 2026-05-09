import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useStore';
import toast from 'react-hot-toast';

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', color: '#e8e8f0', fontFamily: "'Syne', sans-serif" }}>
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2rem', height: '56px',
        background: '#15151c', borderBottom: '1px solid #2a2a3a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <span style={{ fontWeight: 800, fontSize: '18px', color: '#7F77DD' }}>CodeLens AI</span>
          {['/', '/history', '/dashboard'].map((path, i) => (
            <NavLink key={path} to={path} end={path === '/'} style={({ isActive }) => ({
              fontSize: '14px', fontWeight: 600, color: isActive ? '#7F77DD' : '#888',
              textDecoration: 'none', transition: 'color 0.15s'
            })}>
              {['Editor', 'History', 'Dashboard'][i]}
            </NavLink>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user ? (
            <>
              <span style={{ fontSize: '13px', color: '#888' }}>{user.name || user.email}</span>
              <button onClick={handleLogout} style={{
                fontSize: '13px', padding: '6px 14px', borderRadius: '8px',
                border: '1px solid #2a2a3a', background: 'transparent', color: '#888', cursor: 'pointer'
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
