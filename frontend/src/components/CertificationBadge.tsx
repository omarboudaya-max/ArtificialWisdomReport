import React from 'react';

interface BadgeProps {
  score: number;
  date: string;
}

const CertificationBadge: React.FC<BadgeProps> = ({ score, date }) => {
  return (
    <div style={{
      padding: '20px',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: 'white',
      borderRadius: '12px',
      width: '300px',
      border: '2px solid var(--secondary)',
      textAlign: 'center',
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
      fontFamily: "'Outfit', sans-serif"
    }}>
      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--secondary)', fontWeight: 700, marginBottom: '10px' }}>
        Artificial Wisdom
      </div>
      <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '5px' }}>
        CERTIFIED ✅
      </div>
      <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '10px 0' }}>
        {score}
      </div>
      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
        Certified on: {date}
      </div>
      <div style={{ marginTop: '15px', borderTop: '1px solid #334155', paddingTop: '10px', fontSize: '0.6rem', color: '#64748b' }}>
        Verification ID: AW-2024-9982
      </div>
    </div>
  );
};

export default CertificationBadge;
