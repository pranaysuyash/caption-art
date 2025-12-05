import { useState, useEffect } from 'react';
import { Users as UsersIcon, UserPlus, MoreVertical, Mail, Shield, Trash2, Ban, CheckCircle } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { User, InviteUser, UserRole } from '../../../types/account';
import { ROLE_PERMISSIONS } from '../../../types/account';

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('member');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await accountClient.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail) return;

    try {
      const inviteData: InviteUser = {
        email: inviteEmail,
        role: inviteRole,
        message: inviteMessage || undefined,
      };
      await accountClient.inviteUser(inviteData);
      alert('Invitation sent successfully');
      setShowInvite(false);
      setInviteEmail('');
      setInviteRole('member');
      setInviteMessage('');
      loadUsers();
    } catch (error) {
      console.error('Failed to invite user:', error);
      alert('Failed to send invitation');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await accountClient.updateUserRole(userId, newRole);
      loadUsers();
      alert('User role updated successfully');
    } catch (error) {
      console.error('Failed to update role:', error);
      alert('Failed to update user role');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this user?')) return;

    try {
      await accountClient.removeUser(userId);
      loadUsers();
      alert('User removed successfully');
    } catch (error) {
      console.error('Failed to remove user:', error);
      alert('Failed to remove user');
    }
  };

  const handleSuspendUser = async (userId: string) => {
    try {
      await accountClient.suspendUser(userId);
      loadUsers();
      alert('User suspended successfully');
    } catch (error) {
      console.error('Failed to suspend user:', error);
      alert('Failed to suspend user');
    }
  };

  const handleReactivateUser = async (userId: string) => {
    try {
      await accountClient.reactivateUser(userId);
      loadUsers();
      alert('User reactivated successfully');
    } catch (error) {
      console.error('Failed to reactivate user:', error);
      alert('Failed to reactivate user');
    }
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      owner: '#8b5cf6',
      admin: '#3b82f6',
      member: '#10b981',
      viewer: '#6b7280',
    };
    return colors[role];
  };

  const getStatusColor = (status: User['status']) => {
    const colors = {
      active: '#10b981',
      invited: '#f59e0b',
      suspended: '#ef4444',
    };
    return colors[status];
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="settings-section-title">
              <UsersIcon size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Team Management
            </h2>
            <p className="settings-section-description">
              Invite team members and manage their roles and permissions
            </p>
          </div>
          <button
            className="settings-button settings-button-primary"
            onClick={() => setShowInvite(true)}
          >
            <UserPlus size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Invite User
          </button>
        </div>
      </div>

      {showInvite && (
        <div style={{
          background: '#f8f9fa',
          padding: '1.5rem',
          borderRadius: '8px',
          marginBottom: '2rem',
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Invite New User</h3>
          
          <div className="settings-form-group">
            <label className="settings-form-label">Email Address</label>
            <input
              type="email"
              className="settings-input"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">Role</label>
            <select
              className="settings-select"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as UserRole)}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="viewer">Viewer</option>
            </select>
            <span className="settings-form-hint">
              {inviteRole === 'admin' && 'Can manage workspaces, campaigns, and users'}
              {inviteRole === 'member' && 'Can create and edit campaigns'}
              {inviteRole === 'viewer' && 'Read-only access'}
            </span>
          </div>

          <div className="settings-form-group">
            <label className="settings-form-label">Custom Message (Optional)</label>
            <textarea
              className="settings-textarea"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              placeholder="Add a personal message to the invitation email"
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="settings-button settings-button-primary" onClick={handleInvite}>
              <Mail size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Send Invitation
            </button>
            <button className="settings-button settings-button-secondary" onClick={() => setShowInvite(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.9rem',
        }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>User</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Role</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Last Login</th>
              <th style={{ padding: '1rem', textAlign: 'right', fontWeight: 600 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      color: '#666',
                    }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{user.name}</div>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{user.email}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '1rem' }}>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={user.role === 'owner'}
                    style={{
                      padding: '0.5rem',
                      borderRadius: '6px',
                      border: '1px solid #e0e0e0',
                      background: user.role === 'owner' ? '#f8f9fa' : 'white',
                      color: getRoleColor(user.role),
                      fontWeight: 600,
                      cursor: user.role === 'owner' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="owner">Owner</option>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: 'white',
                    background: getStatusColor(user.status),
                  }}>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: '#666' }}>
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right' }}>
                  {user.role !== 'owner' && (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      {user.status === 'active' ? (
                        <button
                          onClick={() => handleSuspendUser(user.id)}
                          style={{
                            padding: '0.5rem',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#f59e0b',
                          }}
                          title="Suspend user"
                        >
                          <Ban size={18} />
                        </button>
                      ) : user.status === 'suspended' ? (
                        <button
                          onClick={() => handleReactivateUser(user.id)}
                          style={{
                            padding: '0.5rem',
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            color: '#10b981',
                          }}
                          title="Reactivate user"
                        >
                          <CheckCircle size={18} />
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleRemoveUser(user.id)}
                        style={{
                          padding: '0.5rem',
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                        title="Remove user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#f8f9fa',
        borderRadius: '8px',
      }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>Role Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          {Object.entries(ROLE_PERMISSIONS).map(([role, permissions]) => (
            <div key={role} style={{
              padding: '1rem',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #e0e0e0',
            }}>
              <div style={{
                fontWeight: 600,
                color: getRoleColor(role as UserRole),
                marginBottom: '0.5rem',
                textTransform: 'capitalize',
              }}>
                {role}
              </div>
              <ul style={{
                margin: 0,
                padding: '0 0 0 1.25rem',
                fontSize: '0.85rem',
                color: '#666',
              }}>
                {permissions.slice(0, 5).map((permission) => (
                  <li key={permission}>{permission.replace(/\./g, ' ')}</li>
                ))}
                {permissions.length > 5 && (
                  <li style={{ color: '#999' }}>+{permissions.length - 5} more...</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
