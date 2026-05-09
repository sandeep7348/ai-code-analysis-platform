import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { historyApi } from '../services/api';

const COLORS = ['#7F77DD', '#1D9E75', '#BA7517', '#D85A30'];

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshStats = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        historyApi.getStats(),
        historyApi.getHistory(1, 50)
      ]);
      setStats(statsRes.data);
      setAnalyses(historyRes.data.analyses || []);
    } catch (err) {
      console.error('Failed to refresh stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshStats();
    // Auto-refresh every 10 seconds
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const modeCounts = analyses.reduce((acc, a) => { acc[a.mode] = (acc[a.mode] || 0) + 1; return acc; }, {});
  const modeData = Object.entries(modeCounts).map(([name, value]) => ({ name, value }));

  const langCounts = analyses.reduce((acc, a) => { acc[a.language] = (acc[a.language] || 0) + 1; return acc; }, {});
  const langData = Object.entries(langCounts).map(([name, value]) => ({ name, value }));

  const card = (label, value, color = '#7F77DD') => (
    <div style={{ background: '#15151c', borderRadius: '12px', border: '1px solid #2a2a3a', padding: '1.25rem', textAlign: 'center' }}>
      <div style={{ fontSize: '28px', fontWeight: 800, color }}>{value ?? '—'}</div>
      <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{label}</div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Syne', sans-serif", color: '#e8e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#e8e8f0', margin: 0 }}>Dashboard</h1>
        <button
          onClick={refreshStats}
          disabled={loading}
          style={{
            padding: '8px 16px',
            background: '#7F77DD',
            border: 'none',
            borderRadius: '8px',
            color: '#e8e8f0',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            opacity: loading ? 0.6 : 1
          }}
        >
          🔄 {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '2rem' }}>
        {card('Total Analyses', stats?.totalAnalyses)}
        {card('Avg Score', stats?.avgScore ? Math.round(stats.avgScore) : '—', '#1D9E75')}
        {card('Tokens Used', stats?.totalTokens?.toLocaleString(), '#BA7517')}
        {card('Avg Duration', stats?.avgDuration ? `${Math.round(stats.avgDuration)}ms` : '—', '#D85A30')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ background: '#15151c', borderRadius: '12px', border: '1px solid #2a2a3a', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '1rem', color: '#888' }}>ANALYSES BY MODE</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={modeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {modeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#15151c', borderRadius: '12px', border: '1px solid #2a2a3a', padding: '1.5rem' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '1rem', color: '#888' }}>ANALYSES BY LANGUAGE</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={langData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#555', fontSize: 12 }} />
              <YAxis dataKey="name" type="category" tick={{ fill: '#888', fontSize: 12 }} width={80} />
              <Tooltip contentStyle={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#7F77DD" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ marginTop: '20px', background: '#15151c', borderRadius: '12px', border: '1px solid #2a2a3a', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '1rem', color: '#888' }}>GRAFANA MONITORING</h3>
        <p style={{ fontSize: '13px', color: '#555' }}>
          Full observability available at{' '}
          <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" style={{ color: '#7F77DD' }}>localhost:3001</a>
          {' '}(admin / grafana123) — Prometheus metrics, request rates, AI latency, cache hit rates, MongoDB ops.
        </p>
      </div>
    </div>
  );
}
