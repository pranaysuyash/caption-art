import React from 'react';

interface WelcomeModalProps {
  onClose: () => void;
}

export function WelcomeModal({ onClose }: WelcomeModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--color-bg-secondary, #1e293b)',
        padding: '2.5rem',
        borderRadius: '16px',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid var(--color-border, #334155)',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👋</div>
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: 700, 
          marginBottom: '1rem',
          color: 'var(--color-text, white)'
        }}>
          Welcome to Caption Art!
        </h2>
        <p style={{ 
          color: 'var(--color-text-secondary, #94a3b8)', 
          lineHeight: 1.6,
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}>
          We're excited to help you create amazing captions. Here's how to get started:
        </p>
        
        <div style={{ textAlign: 'left', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>1</div>
            <div style={{ color: 'var(--color-text, white)' }}>Create a <strong>Campaign</strong> to organize your work</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>2</div>
            <div style={{ color: 'var(--color-text, white)' }}>Set up your <strong>Brand Kit</strong> for consistent voice</div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ 
              background: 'rgba(59, 130, 246, 0.1)', 
              color: '#3b82f6', 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontWeight: 'bold'
            }}>3</div>
            <div style={{ color: 'var(--color-text, white)' }}>Upload assets and <strong>Generate</strong> captions!</div>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="btn btn-primary btn-lg"
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Let's Go! 🚀
        </button>
      </div>
    </div>
  );
}
