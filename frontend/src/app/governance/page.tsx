"use client";

import Link from 'next/link';

const mockSystems = [
  { name: 'Customer Support Bot', score: 88, status: 'Compliant', risk: 'Low' },
  { name: 'Financial Predictor v2', score: 92, status: 'Compliant', risk: 'Low' },
  { name: 'HR Resume Screener', score: 65, status: 'Warning', risk: 'High' },
  { name: 'Marketing Personalization', score: 81, status: 'Compliant', risk: 'Medium' }
];

export default function Governance() {
  return (
    <div className="container py-12 animate-fade">
      <header style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem' }}>Enterprise AI Governance</h1>
        <p style={{ color: '#64748b' }}>Overview of all audited systems within your organization.</p>
      </header>

      <div className="flex-responsive" style={{ display: 'flex', gap: '20px', marginBottom: '40px' }}>
        <div className="card glass" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ fontSize: '1.5rem' }}>4</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Systems</p>
        </div>
        <div className="card glass" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#10b981' }}>3</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Compliant</p>
        </div>
        <div className="card glass" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#ef4444' }}>1</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Non-Compliant</p>
        </div>
        <div className="card glass" style={{ flex: 1, minWidth: '150px' }}>
          <h3 style={{ fontSize: '1.5rem', color: '#3b82f6' }}>81.5%</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Avg. Wisdom Score</p>
        </div>
      </div>

      <div className="card glass" style={{ overflowX: 'auto', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <tr>
              <th style={{ padding: '15px 20px' }}>System Name</th>
              <th style={{ padding: '15px 20px' }}>Wisdom Score</th>
              <th style={{ padding: '15px 20px' }}>Compliance Status</th>
              <th style={{ padding: '15px 20px' }}>Risk Level</th>
              <th style={{ padding: '15px 20px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockSystems.map((system, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 20px', fontWeight: 600 }}>{system.name}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    background: system.score > 80 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: system.score > 80 ? '#10b981' : '#ef4444',
                    fontWeight: 700
                  }}>
                    {system.score}%
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>{system.status}</td>
                <td style={{ padding: '15px 20px' }}>{system.risk}</td>
                <td style={{ padding: '15px 20px' }}>
                  <Link href="/dashboard" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>View Report</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-12">
        <Link href="/" className="btn btn-primary">Back to Dashboard</Link>
      </div>
    </div>
  );
}
