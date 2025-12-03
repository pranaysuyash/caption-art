import { useState } from 'react'
import { Navigate } from 'react-router-dom'

interface LoginProps {
  onLogin: (token: string) => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSignup, setIsSignup] = useState(false)
  const [agencyName, setAgencyName] = useState('')

  const handleSignup = async () => {
    setIsSignup(true)
  }

  const handleBackToLogin = () => {
    setIsSignup(false)
    setAgencyName('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login'
      const body = isSignup
        ? { email, password, agencyName: agencyName || 'Default Agency' }
        : { email, password }

      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || `${isSignup ? 'Signup' : 'Login'} failed`)
      }

      const data = await response.json()
      onLogin(data.token || 'mock_token') // Use backend token or mock for now
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--color-background, #f8fafc)',
      fontFamily: 'var(--font-body, sans-serif)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        padding: '2rem',
        backgroundColor: 'var(--color-surface, white)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: 'var(--color-text, #1f2937)',
            margin: 0
          }}>
            Caption Art
          </h1>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            {isSignup ? 'Create your agency account' : 'Agency Creative Engine'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {isSignup && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '500',
                color: 'var(--color-text, #1f2937)'
              }}>
                Agency Name
              </label>
              <input
                type="text"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="My Creative Agency"
                className="input"
                required={isSignup}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--color-border, #d1d5db)',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
            </div>
          )}

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--color-text, #1f2937)'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agency@example.com"
              className="input"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              marginBottom: '0.5rem',
              fontWeight: '500',
              color: 'var(--color-text, #1f2937)'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input"
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--color-border, #d1d5db)',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: 'var(--color-error-bg, #fef2f2)',
              border: '1px solid var(--color-error, #dc2626)',
              borderRadius: '6px',
              color: 'var(--color-error, #dc2626)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || (isSignup && !agencyName)}
            className="button button-primary"
            style={{
              padding: '0.75rem',
              border: 'none',
              borderRadius: '6px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: (loading || !email || !password || (isSignup && !agencyName)) ? 0.5 : 1,
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: 'white'
            }}
          >
            {loading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: 'var(--color-text-secondary, #6b7280)'
        }}>
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            onClick={isSignup ? handleBackToLogin : handleSignup}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-primary, #2563eb)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginLeft: '0.25rem'
            }}
          >
            {isSignup ? 'Sign in' : 'Sign up'}
          </button>
        </div>

        <div style={{
          marginTop: '0.5rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'var(--color-text-secondary, #6b7280)'
        }}>
          Demo: Use test@example.com / testpassword123
        </div>
      </div>
    </div>
  )
}