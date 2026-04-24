"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CertificationBadge from '@/components/CertificationBadge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Dashboard() {
  const [report, setReport] = useState<any>(null);

  const generatePDF = () => {
    const input = document.getElementById('report-content');
    if (!input) return;

    html2canvas(input, { 
      scale: 2,
      useCORS: true,
      backgroundColor: '#0f172a'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`AW-Report-${new Date().getTime()}.pdf`);
    });
  };

  useEffect(() => {
    // Simulate fetching report from backend
    setReport({
      overall_score: 87.5,
      metrics: {
        model_wisdom: 89,
        data_wisdom: 84,
        system_wisdom: 90
      },
      risk_level: "Low",
      insights: [
        "Optimal accuracy across primary datasets",
        "Low bias detected in demographic subsets",
        "System infrastructure is highly resilient"
      ],
      certified_date: "April 23, 2026"
    });
  }, []);

  if (!report) return <div className="p-20 text-center">Loading Report...</div>;

  return (
    <div className="container py-12 animate-fade">
      <div id="report-content" style={{ padding: '20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem' }}>Artificial Wisdom Report</h1>
            <p style={{ color: '#64748b' }}>Audit ID: AW-98234-X</p>
          </div>
          <div className="glass" style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: 600 }}>Status:</span>
            <span style={{ color: 'var(--secondary)', fontWeight: 700 }}>CERTIFIED ✅</span>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
          {/* Score Overview & Badge */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card glass text-center">
              <h2 style={{ fontSize: '3.5rem', color: 'var(--secondary)', margin: '10px 0' }}>{report.overall_score}</h2>
              <p style={{ fontWeight: 600, fontSize: '1.2rem', marginBottom: '20px' }}>Overall Wisdom Score</p>
              <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
                Risk Level: {report.risk_level}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <CertificationBadge score={report.overall_score} date={report.certified_date} />
            </div>
            
            {/* Benchmarking Section */}
            <div className="card glass">
              <h4 style={{ marginBottom: '15px' }}>Industry Benchmarking</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>Finance Avg</span>
                    <span>78%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ width: '78%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                    <span>Healthcare Avg</span>
                    <span>82%</span>
                  </div>
                  <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                    <div style={{ width: '82%', height: '100%', background: 'var(--primary)', borderRadius: '2px' }}></div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', padding: '10px', background: 'rgba(6, 182, 212, 0.1)', borderRadius: '8px' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--secondary)', fontWeight: 600 }}>
                    Your system outperforms 92% of audited models in the General AI category.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown & Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <div className="card glass">
                <h3 style={{ fontSize: '1.8rem', color: 'var(--primary)' }}>{report.metrics.model_wisdom}%</h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Model Wisdom</p>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '15px' }}>
                  <div style={{ width: `${report.metrics.model_wisdom}%`, height: '100%', background: 'var(--primary)', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                </div>
                <ul style={{ fontSize: '0.75rem', marginTop: '15px', color: '#94a3b8', listStyle: 'none' }}>
                  <li>• Accuracy: 94%</li>
                  <li>• F-Score: 0.92</li>
                </ul>
              </div>
              <div className="card glass">
                <h3 style={{ fontSize: '1.8rem', color: 'var(--secondary)' }}>{report.metrics.data_wisdom}%</h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Data Wisdom</p>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '15px' }}>
                  <div style={{ width: `${report.metrics.data_wisdom}%`, height: '100%', background: 'var(--secondary)', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                </div>
                <ul style={{ fontSize: '0.75rem', marginTop: '15px', color: '#94a3b8', listStyle: 'none' }}>
                  <li>• Bias Detection: Pass</li>
                  <li>• GDPR: Compliant</li>
                </ul>
              </div>
              <div className="card glass">
                <h3 style={{ fontSize: '1.8rem', color: '#8b5cf6' }}>{report.metrics.system_wisdom}%</h3>
                <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>System Wisdom</p>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '15px' }}>
                  <div style={{ width: `${report.metrics.system_wisdom}%`, height: '100%', background: '#8b5cf6', borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                </div>
                <ul style={{ fontSize: '0.75rem', marginTop: '15px', color: '#94a3b8', listStyle: 'none' }}>
                  <li>• Latency: 120ms</li>
                  <li>• Security: A+</li>
                </ul>
              </div>
            </div>

            <div className="card glass">
              <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Key Insights & Recommendations</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {report.insights.map((insight: string, i: number) => (
                  <div key={i} style={{ padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', borderLeft: '4px solid var(--secondary)' }}>
                    <p style={{ fontWeight: 500 }}>{insight}</p>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Continuous Monitoring Preview */}
            <div className="card glass" style={{ border: '2px dashed var(--glass-border)', background: 'transparent' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>Continuous Monitoring (Alpha)</h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Automatically re-audit your system every 24 hours.</p>
                </div>
                <button className="btn btn-primary" style={{ fontSize: '0.8rem' }}>Enable Monitoring</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center" style={{ marginTop: '60px', display: 'flex', gap: '20px', justifyContent: 'center' }}>
        <button onClick={generatePDF} className="btn btn-secondary" style={{ padding: '15px 40px' }}>Download Full Report (PDF)</button>
        <Link href="/" className="btn btn-primary" style={{ padding: '15px 40px' }}>Start New Audit</Link>
      </div>
    </div>
  );
}
