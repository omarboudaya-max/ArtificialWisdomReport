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

      <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
        <div className="card glass">
          <h3 style={{ fontSize: '1.5rem' }}>4</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Systems</p>
        </div>
        <div className="card glass">
          <h3 style={{ fontSize: '1.5rem', color: '#10b981' }}>3</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Compliant</p>
        </div>
        <div className="card glass">
          <h3 style={{ fontSize: '1.5rem', color: '#ef4444' }}>1</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Non-Compliant</p>
        </div>
        <div className="card glass">
          <h3 style={{ fontSize: '1.5rem', color: '#3b82f6' }}>81.5%</h3>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Avg. Wisdom Score</p>
        </div>
      </div>

      <div className="card glass" style={{ overflow: 'hidden', padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
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
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '15px 20px', fontWeight: 600 }}>{system.name}</td>
                <td style={{ padding: '15px 20px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '4px', 
                    background: system.score > 80 ? '#f0fdf4' : '#fef2f2',
                    color: system.score > 80 ? '#166534' : '#991b1b',
                    fontWeight: 700
                  }}>
                    {system.score}%
                  </span>
                </td>
                <td style={{ padding: '15px 20px' }}>{system.status}</td>
                <td style={{ padding: '15px 20px' }}>{system.risk}</td>
                <td style={{ padding: '15px 20px' }}>
                  <Link href="/dashboard" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>View Report</Link>
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
