import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../services/api';
import { useAuthStore } from '../hooks/useStore';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handle = async () => {
    setLoading(true);
    try {
      const fn = isLogin ? authApi.login : authApi.register;
      const { data } = await fn(form);
      setAuth(data.user, data.token);
      toast.success(isLogin ? 'Welcome back!' : 'Account created!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f13', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif" }}>
      <div style={{ width: '400px', background: '#15151c', borderRadius: '16px', border: '1px solid #2a2a3a', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#7F77DD' }}>CodeLens AI</div>
          <div style={{ color: '#555', fontSize: '14px', marginTop: '4px' }}>{isLogin ? 'Sign in to your account' : 'Create a new account'}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isLogin && (
            <input placeholder="Your name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ background: '#0f0f13', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', color: '#ccc', fontSize: '14px' }} />
          )}
          <input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ background: '#0f0f13', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', color: '#ccc', fontSize: '14px' }} />
          <input type="password" placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handle()}
            style={{ background: '#0f0f13', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 14px', color: '#ccc', fontSize: '14px' }} />
          <button onClick={handle} disabled={loading} style={{
            padding: '12px', background: '#7F77DD', border: 'none', borderRadius: '8px',
            color: 'white', fontWeight: 700, fontSize: '15px', cursor: 'pointer', fontFamily: "'Syne', sans-serif",
            opacity: loading ? 0.6 : 1
          }}>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</button>
        </div>

        <p style={{ textAlign: 'center', color: '#555', fontSize: '13px', marginTop: '1.5rem' }}>
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <span onClick={() => setIsLogin(!isLogin)} style={{ color: '#7F77DD', cursor: 'pointer', fontWeight: 600 }}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </p>
      </div>
    </div>
  );
}
