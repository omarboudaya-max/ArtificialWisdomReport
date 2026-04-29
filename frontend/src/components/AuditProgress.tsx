import React, { useState, useEffect } from 'react';

const steps = [
  "Initializing Wisdom Engine...",
  "Probing Endpoint Connectivity...",
  "Analyzing Model Performance (Accuracy/F1)...",
  "Scanning Training Data for Bias...",
  "Verifying GDPR & Ethical Compliance...",
  "Measuring System Infrastructure Latency...",
  "Generating Certification Report..."
];

const AuditProgress: React.FC<{ targetUrl?: string }> = ({ targetUrl }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 1;
      });
    }, 95); // Roughly 9.5 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
    setCurrentStep(stepIndex);
  }, [progress]);

  return (
    <div className="glass animate-fade" style={{ padding: '40px', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '10px' }}>AI Wisdom Audit in Progress</h2>
      <p style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '25px', fontSize: '0.9rem' }}>
        Scanning: {targetUrl || 'Initializing...'}
      </p>
      
      <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden', marginBottom: '30px' }}>
        <div style={{ 
          width: `${progress}%`, 
          height: '100%', 
          background: 'linear-gradient(90deg, var(--primary), var(--secondary))',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.5)'
        }}></div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '15px', 
            opacity: i <= currentStep ? 1 : 0.3,
            transition: 'opacity 0.3s ease',
            color: i === currentStep ? 'var(--secondary)' : 'inherit',
            fontWeight: i === currentStep ? 700 : 400
          }}>
            <div style={{ 
              width: '24px', 
              height: '24px', 
              borderRadius: '50%', 
              border: `2px solid ${i <= currentStep ? 'var(--secondary)' : '#475569'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem'
            }}>
              {i < currentStep ? '✓' : i + 1}
            </div>
            <span>{step}</span>
          </div>
        ))}
      </div>
      
      <p style={{ marginTop: '30px', fontSize: '0.9rem', color: '#94a3b8' }}>
        This audit usually takes between 10-15 seconds. Please do not close this window.
      </p>
    </div>
  );
};

export default AuditProgress;
