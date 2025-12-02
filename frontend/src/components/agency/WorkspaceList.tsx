import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

interface Workspace {
  id: string
  clientName: string
  industry: string
  createdAt: string
  campaignCount?: number
}

interface NewWorkspaceForm {
  clientName: string
  industry: string
}

export function WorkspaceList() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createForm, setCreateForm] = useState<NewWorkspaceForm>({
    clientName: '',
    industry: ''
  })
  const [createLoading, setCreateLoading] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/workspaces`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load workspaces')
      }

      const data = await response.json()
      setWorkspaces(data.workspaces || [])
    } catch (error) {
      console.error('Error loading workspaces:', error)
      // For now, show mock data if API fails
      setWorkspaces([
        {
          id: 'workspace-1',
          clientName: 'Fashion Brand A',
          industry: 'Fashion',
          createdAt: new Date().toISOString(),
          campaignCount: 3
        },
        {
          id: 'workspace-2',
          clientName: 'Tech Company B',
          industry: 'Technology',
          createdAt: new Date().toISOString(),
          campaignCount: 1
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateLoading(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:3001'}/api/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(createForm)
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create workspace')
      }

      const newWorkspace = await response.json()
      setWorkspaces(prev => [...prev, newWorkspace])
      setShowCreateForm(false)
      setCreateForm({ clientName: '', industry: '' })
    } catch (error) {
      console.error('Error creating workspace:', error)
      // For now, add mock workspace if API fails
      const mockWorkspace: Workspace = {
        id: `workspace-${Date.now()}`,
        clientName: createForm.clientName,
        industry: createForm.industry,
        createdAt: new Date().toISOString(),
        campaignCount: 0
      }
      setWorkspaces(prev => [...prev, mockWorkspace])
      setShowCreateForm(false)
      setCreateForm({ clientName: '', industry: '' })
    } finally {
      setCreateLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'var(--font-body, sans-serif)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '2rem',
            fontWeight: 'bold',
            color: 'var(--color-text, #1f2937)',
            margin: 0
          }}>
            Workspaces
          </h1>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginTop: '0.5rem',
            marginBottom: 0
          }}>
            Manage your client workspaces and campaigns
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="button button-primary"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: 'var(--color-primary, #2563eb)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          + New Workspace
        </button>
      </div>

      {/* Create Workspace Modal */}
      {showCreateForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--color-surface, white)',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          }}>
            <h2 style={{
              fontFamily: 'var(--font-heading, sans-serif)',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: 'var(--color-text, #1f2937)',
              margin: '0 0 1.5rem 0'
            }}>
              Create New Workspace
            </h2>

            <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '500',
                  color: 'var(--color-text, #1f2937)'
                }}>
                  Client Name
                </label>
                <input
                  type="text"
                  value={createForm.clientName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g., Fashion Brand A"
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
                  Industry
                </label>
                <select
                  value={createForm.industry}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, industry: e.target.value }))}
                  className="input"
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    borderRadius: '6px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Select industry</option>
                  <option value="fashion">Fashion</option>
                  <option value="technology">Technology</option>
                  <option value="food">Food & Beverage</option>
                  <option value="beauty">Beauty & Cosmetics</option>
                  <option value="automotive">Automotive</option>
                  <option value="travel">Travel & Hospitality</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div style={{
                display: 'flex',
                gap: '1rem',
                justifyContent: 'flex-end',
                marginTop: '1rem'
              }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false)
                    setCreateForm({ clientName: '', industry: '' })
                  }}
                  className="button button-secondary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    border: '1px solid var(--color-border, #d1d5db)',
                    backgroundColor: 'transparent',
                    color: 'var(--color-text, #1f2937)',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !createForm.clientName || !createForm.industry}
                  className="button button-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'var(--color-primary, #2563eb)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    cursor: createLoading ? 'not-allowed' : 'pointer',
                    opacity: (createLoading || !createForm.clientName || !createForm.industry) ? 0.5 : 1
                  }}
                >
                  {createLoading ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: 'var(--color-text-secondary, #6b7280)'
        }}>
          Loading workspaces...
        </div>
      )}

      {/* Empty State */}
      {!loading && workspaces.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          backgroundColor: 'var(--color-background, #f8fafc)',
          borderRadius: '12px',
          border: '2px dashed var(--color-border, #d1d5db)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏢</div>
          <h3 style={{
            fontFamily: 'var(--font-heading, sans-serif)',
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--color-text, #1f2937)',
            margin: '0 0 0.5rem 0'
          }}>
            No workspaces yet
          </h3>
          <p style={{
            color: 'var(--color-text-secondary, #6b7280)',
            marginBottom: '1.5rem',
            maxWidth: '400px',
            margin: '0 auto 1.5rem'
          }}>
            Create your first workspace to start organizing client campaigns and creative assets.
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="button button-primary"
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--color-primary, #2563eb)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Create Your First Workspace
          </button>
        </div>
      )}

      {/* Workspaces Grid */}
      {!loading && workspaces.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/agency/workspaces/${workspace.id}/campaigns`}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div style={{
                backgroundColor: 'var(--color-surface, white)',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: '12px',
                padding: '1.5rem',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-primary, #2563eb)'
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border, #e5e7eb)'
                e.currentTarget.style.boxShadow = 'none'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <h3 style={{
                      fontFamily: 'var(--font-heading, sans-serif)',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      color: 'var(--color-text, #1f2937)',
                      margin: '0 0 0.25rem 0'
                    }}>
                      {workspace.clientName}
                    </h3>
                    <p style={{
                      color: 'var(--color-text-secondary, #6b7280)',
                      fontSize: '0.875rem',
                      margin: 0
                    }}>
                      {workspace.industry}
                    </p>
                  </div>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'var(--color-primary, #2563eb)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.25rem'
                  }}>
                    🏢
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--color-text-secondary, #6b7280)'
                }}>
                  <span>{workspace.campaignCount || 0} campaigns</span>
                  <span>Created {formatDate(workspace.createdAt)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}