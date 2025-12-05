import { useState } from 'react';
import apiFetch from '../../lib/api/httpClient';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
  onLogin: () => Promise<void> | void;
}

export function Login({ onLogin }: LoginProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [agencyName, setAgencyName] = useState('');

  const handleSignup = async () => {
    setIsSignup(true);
  };

  const handleBackToLogin = () => {
    setIsSignup(false);
    setAgencyName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBase = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const body = isSignup
        ? { email, password, agencyName: agencyName || 'Default Agency' }
        : { email, password };

      const response = await apiFetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          data.error || `${isSignup ? 'Signup' : 'Login'} failed`
        );
      }

      await response.json();

      // Let the parent re-validate session against the real backend
      await onLogin();

      // Small delay to ensure auth state is updated
      await new Promise((resolve) => setTimeout(resolve, 100));

      navigate('/agency/workspaces', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 20% 20%, #0ea5e933, transparent 45%), radial-gradient(circle at 80% 0%, #6366f133, transparent 40%), #0f172a',
        fontFamily: 'var(--font-body, "Inter", system-ui, sans-serif)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '14px',
          boxShadow:
            '0 15px 45px rgba(15, 23, 42, 0.25), 0 2px 6px rgba(15, 23, 42, 0.08)',
          border: '1px solid rgba(15,23,42,0.08)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1
            style={{
              fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)',
              fontSize: '2rem',
              fontWeight: 700,
              color: '#0b1220',
              margin: 0,
            }}
          >
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p
            style={{
              color: '#6b7280',
              marginTop: '0.5rem',
              marginBottom: 0,
              fontSize: '0.875rem',
            }}
          >
            {isSignup
              ? 'Set up your agency account to get started'
              : 'Sign in to access your creative workspace'}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {isSignup && (
            <div>
              <label
                style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#0b1220',
                  fontSize: '0.875rem',
                }}
              >
                Agency Name *
              </label>
              <input
                type='text'
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder='Enter your agency name'
                autoComplete='organization'
                className='input'
                required={isSignup}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  backgroundColor: '#ffffff',
                  color: '#0b1220',
                  caretColor: '#0b1220',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#0ea5e9';
                  e.target.style.boxShadow =
                    '0 0 0 3px rgba(14, 165, 233, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#0b1220',
                fontSize: '0.875rem',
              }}
            >
              Email Address *
            </label>
            <input
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder='Enter your email address'
              autoComplete='email'
              className='input'
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                color: '#0b1220',
                caretColor: '#0b1220',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0ea5e9';
                e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#0b1220',
                fontSize: '0.875rem',
              }}
            >
              Password *
            </label>
            <input
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              autoComplete='current-password'
              className='input'
              required
              style={{
                width: '100%',
                padding: '0.875rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                color: '#0b1220',
                caretColor: '#0b1220',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0ea5e9';
                e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '0.75rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #dc2626',
                borderRadius: '10px',
                color: '#991b1b',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            type='submit'
            disabled={
              loading || !email || !password || (isSignup && !agencyName)
            }
            className='button button-primary'
            style={{
              padding: '0.75rem',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity:
                loading || !email || !password || (isSignup && !agencyName)
                  ? 0.6
                  : 1,
              background: 'linear-gradient(120deg, #0ea5e9, #2563eb)',
              color: 'white',
              boxShadow: '0 10px 30px rgba(37, 99, 235, 0.35)',
            }}
          >
            {loading
              ? isSignup
                ? 'Creating account...'
                : 'Signing in...'
              : isSignup
              ? 'Sign Up'
              : 'Sign In'}
          </button>
        </form>

        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-text-secondary, #6b7280)',
          }}
        >
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button
            type='button'
            onClick={isSignup ? handleBackToLogin : handleSignup}
            style={{
              background: 'none',
              border: 'none',
              color: '#0ea5e9',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginLeft: '0.25rem',
            }}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <div
          style={{
            marginTop: '1rem',
            textAlign: 'center',
            fontSize: '0.875rem',
            color: '#6b7280',
            backgroundColor: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            Demo Account
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            Email:{' '}
            <code
              style={{
                backgroundColor: '#e5e7eb',
                padding: '0.125rem 0.25rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
              }}
            >
              test@example.com
            </code>
            <br />
            Password:{' '}
            <code
              style={{
                backgroundColor: '#e5e7eb',
                padding: '0.125rem 0.25rem',
                borderRadius: '3px',
                fontSize: '0.75rem',
              }}
            >
              testpassword123
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
