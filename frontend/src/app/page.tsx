"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuditProgress from '@/components/AuditProgress';

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    
    setIsLoading(true);
    
    try {
      const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' ? '/api' : 'http://localhost:8000';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || defaultApiUrl;
      const response = await fetch(`${apiUrl}/audit/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: input }),
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        const auditId = data.audit_id;
        
        // Show progress for a bit then redirect with real ID
        setTimeout(() => {
          setIsLoading(false);
          // Use window.location for a hard redirect to clear all state
          window.location.href = `/dashboard?id=${auditId}`;
        }, 6500);
        return;
      }
    } catch (error) {
      console.log("Backend error, using fallback");
    }
    
    // Fallback redirect if backend fails
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 6500);
  };

  return (
    <main className="hero">
      <div className="container animate-fade">
        {isLoading ? (
          <AuditProgress targetUrl={input} />
        ) : (
          <>
            <div className="badge-pill mb-4" style={{ 
              background: 'rgba(99, 102, 241, 0.1)', 
              color: 'var(--primary)', 
              padding: '8px 16px', 
              borderRadius: '20px',
              display: 'inline-block',
              fontWeight: 600,
              marginBottom: '20px',
              border: '1px solid rgba(99, 102, 241, 0.2)'
            }}>
              Global Standard for AI Governance
            </div>
            <h1>Scan your AI.<br />Certify its Wisdom.</h1>
            <p>
              Artificial Wisdom is the world's first automated AI auditing platform. 
              Evaluate performance, ethics, and security in real-time.
            </p>
            
            <form onSubmit={handleStartAudit} className="input-group glass" style={{ padding: '20px', borderRadius: '16px', maxWidth: '700px' }}>
              <input 
                type="text" 
                placeholder="Enter URL or API Endpoint (e.g., https://api.your-ai.com)" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <button type="submit" className="btn btn-primary" disabled={isLoading}>
                {isLoading ? 'Scanning...' : 'Start Audit'}
              </button>
            </form>
            
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
              <button 
                onClick={() => setInput('https://www.investraders.net/')}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'rgba(255,255,255,0.5)', 
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  textDecoration: 'underline'
                }}
              >
                Or try with sample: investraders.net
              </button>

              <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                Looking for Enterprise solutions? 
                <Link href="/governance" style={{ color: 'var(--primary)', fontWeight: 600, marginLeft: '8px', textDecoration: 'none' }}>
                  View Governance Dashboard
                </Link>
              </p>
            </div>
            
            <div className="mt-12 grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '60px' }}>
              <div className="card glass">
                <h3>Model Audit</h3>
                <p>Real-time performance metrics: Accuracy, Precision, Recall, and F-Score.</p>
              </div>
              <div className="card glass">
                <h3>Data Integrity</h3>
                <p>Bias detection, discrimination analysis, and compliance verification.</p>
              </div>
              <div className="card glass">
                <h3>Infrastructure</h3>
                <p>Security assessment, latency tracking, and scalability indicators.</p>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
