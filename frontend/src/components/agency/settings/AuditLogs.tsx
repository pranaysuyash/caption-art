import { useState, useEffect } from 'react';
import { Bell, Download, Filter, Search, RefreshCw } from 'lucide-react';
import { accountClient } from '../../../lib/api/accountClient';
import type { AuditLogEntry } from '../../../types/account';

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    startDate: '',
    endDate: '',
    limit: 50,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await accountClient.getAuditLogs(filters);
      setLogs(data);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const blob = await accountClient.exportAuditLogs(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString()}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
      alert('Failed to export audit logs');
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return '#10b981';
    if (action.includes('delete')) return '#ef4444';
    if (action.includes('update') || action.includes('edit')) return '#f59e0b';
    if (action.includes('login')) return '#3b82f6';
    return '#6b7280';
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(search) ||
      log.resource.toLowerCase().includes(search) ||
      log.user.name.toLowerCase().includes(search) ||
      log.user.email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 className="settings-section-title">
              <Bell size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Audit Logs
            </h2>
            <p className="settings-section-description">
              Track all user actions and system events for compliance and security
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="settings-button settings-button-secondary"
              onClick={() => handleExport('csv')}
            >
              <Download size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Export CSV
            </button>
            <button
              className="settings-button settings-button-secondary"
              onClick={() => handleExport('json')}
            >
              <Download size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        padding: '1.5rem',
        background: '#f8f9fa',
        borderRadius: '12px',
        marginBottom: '2rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Filter size={20} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Filters</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              Start Date
            </label>
            <input
              type="date"
              className="settings-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              End Date
            </label>
            <input
              type="date"
              className="settings-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              Action Type
            </label>
            <select
              className="settings-select"
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            >
              <option value="">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="export">Export</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: 600 }}>
              Limit
            </label>
            <select
              className="settings-select"
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
            >
              <option value="50">50 results</option>
              <option value="100">100 results</option>
              <option value="200">200 results</option>
              <option value="500">500 results</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="settings-button settings-button-primary"
            onClick={loadLogs}
          >
            <RefreshCw size={16} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
            Apply Filters
          </button>
          <button
            className="settings-button settings-button-secondary"
            onClick={() => {
              setFilters({ userId: '', action: '', startDate: '', endDate: '', limit: 50 });
              loadLogs();
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={20}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
            }}
          />
          <input
            type="text"
            className="settings-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search logs by action, resource, or user..."
            style={{ paddingLeft: '3rem' }}
          />
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading audit logs...
        </div>
      ) : filteredLogs.length > 0 ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.9rem',
          }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Timestamp</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Action</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Resource</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>Details</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600 }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                  <td style={{ padding: '1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600 }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{log.user.name}</div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>{log.user.email}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      background: `${getActionColor(log.action)}20`,
                      color: getActionColor(log.action),
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 600 }}>{log.resource}</div>
                    {log.resourceId && (
                      <div style={{ fontSize: '0.75rem', color: '#666', fontFamily: 'monospace' }}>
                        {log.resourceId.substring(0, 8)}...
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', maxWidth: '200px' }}>
                    {log.details && Object.keys(log.details).length > 0 ? (
                      <details>
                        <summary style={{ cursor: 'pointer', color: '#007bff' }}>
                          View details
                        </summary>
                        <pre style={{
                          marginTop: '0.5rem',
                          padding: '0.5rem',
                          background: '#f8f9fa',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          overflow: 'auto',
                        }}>
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </details>
                    ) : (
                      <span style={{ color: '#999' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: '#666' }}>
                    {log.ipAddress || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          background: '#f8f9fa',
          borderRadius: '12px',
        }}>
          <Bell size={48} color="#ccc" style={{ marginBottom: '1rem' }} />
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#666' }}>No Audit Logs Found</h3>
          <p style={{ margin: 0, color: '#999' }}>
            {searchTerm ? 'Try adjusting your search or filters' : 'Audit logs will appear here once actions are performed'}
          </p>
        </div>
      )}

      {/* Info Panel */}
      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
      }}>
        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af' }}>About Audit Logs</h4>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#1e40af' }}>
          Audit logs track all significant actions performed in your account for security and compliance purposes. 
          Logs are retained for {filters.limit} days by default. Enterprise plans can configure custom retention periods.
        </p>
      </div>
    </div>
  );
}
