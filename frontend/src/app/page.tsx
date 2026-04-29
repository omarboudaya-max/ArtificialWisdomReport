"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuditProgress from '@/components/AuditProgress';

export default function Home() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleStartAudit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;
    
    setIsLoading(true);
    
    // Generate ID locally to skip backend cold-start delays completely
    try {
      const url = input || "https://www.investraders.net/";
      const encodedUrl = btoa(url).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const auditId = `audit_${encodedUrl}_${Math.floor(Date.now() / 1000)}`;
      window.location.href = `/dashboard?id=${auditId}`;
    } catch (error) {
      const fallbackId = `audit_${Date.now()}`;
      window.location.href = `/dashboard?id=${fallbackId}`;
    }
  };

  const [activeTab, setActiveTab] = useState('url');

  return (
    <>
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid var(--glass-border)', flexWrap: 'wrap', gap: '15px' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Artificial Wisdom Logo" style={{ height: '48px', marginRight: '12px' }} />
          Artificial Wisdom
        </div>
        <nav style={{ display: 'flex', gap: '20px', fontWeight: 500, flexWrap: 'wrap' }}>
          <Link href="#features" style={{ color: 'var(--foreground)', textDecoration: 'none' }}>Features</Link>
          <Link href="#how-it-works" style={{ color: 'var(--foreground)', textDecoration: 'none' }}>How It Works</Link>
          <Link href="#pricing" style={{ color: 'var(--foreground)', textDecoration: 'none' }}>Pricing</Link>
        </nav>
      </header>

      <main className="hero" style={{ padding: '80px 20px 40px' }}>
        <div className="container animate-fade" style={{ maxWidth: '1200px' }}>
          
          {/* Hero Content */}
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h1>Scan Your AI.<br />Certify Its Wisdom.</h1>
            <p style={{ maxWidth: '800px', margin: '0 auto 40px', fontSize: '1.2rem', color: '#94a3b8' }}>
              The global standard for AI governance, trust, and certification. Audit your AI systems in real time and earn your Artificial Wisdom Certification.
            </p>
            
            {/* Stats Row */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginBottom: '60px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>500+</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Systems Audited</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>99.9%</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Uptime</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>24/7</div>
                <div style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Support</div>
              </div>
            </div>
          </div>

          {/* Audit Input Area */}
          <div className="glass" style={{ maxWidth: '800px', margin: '0 auto 80px', padding: '40px', borderRadius: '24px' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.5rem' }}>Start Your Audit</h3>
            
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={() => setActiveTab('url')} style={{ background: activeTab === 'url' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: activeTab === 'url' ? 'var(--primary)' : '#94a3b8', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: '1 1 auto', minWidth: '120px' }}>Website URL</button>
              <button onClick={() => setActiveTab('api')} style={{ background: activeTab === 'api' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: activeTab === 'api' ? 'var(--primary)' : '#94a3b8', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: '1 1 auto', minWidth: '120px' }}>API Endpoint</button>
              <button onClick={() => setActiveTab('upload')} style={{ background: activeTab === 'upload' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', color: activeTab === 'upload' ? 'var(--primary)' : '#94a3b8', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: '1 1 auto', minWidth: '120px' }}>Upload System</button>
            </div>

            <form onSubmit={handleStartAudit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'left' }}>
                <label style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 500 }}>Enter your AI system URL</label>
                <input 
                  type="text" 
                  placeholder="https://your-ai-system.com" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.3)', color: 'white', fontSize: '1rem', width: '100%' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ width: '100%', padding: '16px', fontSize: '1.1rem' }}>
                {isLoading ? 'Connecting...' : 'Start Audit'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#64748b', marginTop: '10px' }}>
                Free scan included. Full report available with certification.
              </p>
            </form>
          </div>

          {/* Features Section */}
          <div id="features" style={{ marginBottom: '100px' }}>
            <div style={{ textAlign: 'center', marginBottom: '50px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '15px' }}>Comprehensive AI Auditing</h2>
              <p style={{ color: '#94a3b8', fontSize: '1.1rem' }}>Multi-layer evaluation across model, data, and infrastructure</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
              <div className="card glass" style={{ padding: '40px', textAlign: 'left' }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>🧠</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Model Audit</h3>
                <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.6' }}>Evaluate accuracy, precision, recall, F-score, and model explainability using advanced metrics.</p>
                <ul style={{ color: '#cbd5e1', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>✓ Performance metrics</li>
                  <li>✓ Model explainability</li>
                  <li>✓ Transparency scoring</li>
                </ul>
              </div>
              
              <div className="card glass" style={{ padding: '40px', textAlign: 'left' }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>📊</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Data Audit</h3>
                <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.6' }}>Ensure ethical, compliant, and high-quality data usage with bias detection.</p>
                <ul style={{ color: '#cbd5e1', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>✓ Bias detection</li>
                  <li>✓ GDPR compliance</li>
                  <li>✓ Data quality check</li>
                </ul>
              </div>
              
              <div className="card glass" style={{ padding: '40px', textAlign: 'left' }}>
                <div style={{ fontSize: '2rem', marginBottom: '20px' }}>⚙️</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '15px' }}>Infrastructure Audit</h3>
                <p style={{ color: '#94a3b8', marginBottom: '25px', lineHeight: '1.6' }}>Evaluate technical robustness, security, and performance at scale.</p>
                <ul style={{ color: '#cbd5e1', listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <li>✓ Security assessment</li>
                  <li>✓ Latency & scalability</li>
                  <li>✓ Inference speed</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Certification Section */}
          <div className="glass" style={{ background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1))', padding: '60px 40px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '80px', flexWrap: 'wrap', gap: '40px' }}>
            <div style={{ flex: '1 1 500px', textAlign: 'left' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Earn Your Certification Badge</h2>
              <p style={{ color: '#cbd5e1', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Pass your audit and get an embeddable certification badge to showcase your AI's wisdom. Build trust with your users and stakeholders.
              </p>
            </div>
            <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>✅</div>
                <h4 style={{ color: 'white', marginBottom: '10px', fontSize: '1.2rem' }}>Artificial Wisdom Certified</h4>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Display your commitment to AI governance and ethical AI practices</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--glass-border)', padding: '60px 40px 30px', background: '#090e17' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '60px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center' }}>
              <img src="/logo.png" alt="Artificial Wisdom Logo" style={{ height: '48px', marginRight: '12px' }} />
              Artificial Wisdom
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.6' }}>
              The global standard for AI governance, trust, and certification.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '10px' }}>Product</h4>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Features</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Pricing</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Documentation</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '10px' }}>Company</h4>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>About</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Blog</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Contact</Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <h4 style={{ color: 'white', fontWeight: 600, marginBottom: '10px' }}>Legal</h4>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Privacy Policy</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.9rem' }}>Terms of Service</Link>
          </div>

        </div>
        
        <div style={{ maxWidth: '1200px', margin: '0 auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <p style={{ color: '#64748b', fontSize: '0.85rem' }}>© 2026 Artificial Wisdom. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>Twitter</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>LinkedIn</Link>
            <Link href="#" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.85rem' }}>GitHub</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
