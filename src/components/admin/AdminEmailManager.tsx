import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailTypeSettings {
  enabled: boolean;
  subject: string;
}

interface EmailSettings {
  welcome: EmailTypeSettings;
  verification: EmailTypeSettings;
  password_reset: EmailTypeSettings;
  bug_submitted: EmailTypeSettings;
}

interface EmailLogEntry {
  id: number;
  emailType: string;
  recipientEmail: string;
  subject: string;
  status: string;
  resendId: string | null;
  errorMessage: string | null;
  createdAt: string;
}

interface EmailLogResponse {
  logs: EmailLogEntry[];
  total: number;
  page: number;
  limit: number;
}

interface EmailLogStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  total: number;
}

const EMAIL_TYPES: { key: keyof EmailSettings; label: string }[] = [
  { key: 'welcome', label: 'Welcome' },
  { key: 'verification', label: 'Verification' },
  { key: 'password_reset', label: 'Password Reset' },
  { key: 'bug_submitted', label: 'Bug Submitted' },
];

const DEFAULT_SETTINGS: EmailSettings = {
  welcome: { enabled: true, subject: 'Welcome to From Zero to Claude Code' },
  verification: { enabled: true, subject: 'Verify your email' },
  password_reset: { enabled: true, subject: 'Reset your password' },
  bug_submitted: { enabled: true, subject: 'Bug report received' },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AdminEmailManager() {
  const [settings, setSettings] = useState<EmailSettings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<EmailLogStats | null>(null);
  const [logs, setLogs] = useState<EmailLogEntry[]>([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logTypeFilter, setLogTypeFilter] = useState('');
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch email settings
  useEffect(() => {
    apiFetch('/api/admin/settings/email_settings')
      .then(async res => {
        if (res.ok) {
          const data = await res.json();
          if (data.value) {
            setSettings(prev => ({
              welcome: { ...prev.welcome, ...data.value.welcome },
              verification: { ...prev.verification, ...data.value.verification },
              password_reset: { ...prev.password_reset, ...data.value.password_reset },
              bug_submitted: { ...prev.bug_submitted, ...data.value.bug_submitted },
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  // Fetch stats
  useEffect(() => {
    apiFetch('/api/admin/email/log/stats')
      .then(async res => {
        if (res.ok) setStats(await res.json());
      })
      .catch(() => {});
  }, []);

  // Fetch logs
  const fetchLogs = useCallback(() => {
    const params = new URLSearchParams({ page: String(logPage), limit: '50' });
    if (logTypeFilter) params.set('type', logTypeFilter);

    apiFetch(`/api/admin/email/log?${params}`)
      .then(async res => {
        if (res.ok) {
          const data: EmailLogResponse = await res.json();
          setLogs(data.logs);
          setLogTotal(data.total);
        }
      })
      .catch(() => {});
  }, [logPage, logTypeFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function saveSettings(updated: EmailSettings) {
    setSaving(true);
    try {
      await apiFetch('/api/admin/settings/email_settings', {
        method: 'PUT',
        body: JSON.stringify({ value: updated }),
      });
      setSettings(updated);
    } catch {
      // Silently fail
    } finally {
      setSaving(false);
    }
  }

  function toggleEnabled(key: keyof EmailSettings) {
    const updated = {
      ...settings,
      [key]: { ...settings[key], enabled: !settings[key].enabled },
    };
    saveSettings(updated);
  }

  function saveSubject(key: keyof EmailSettings) {
    const updated = {
      ...settings,
      [key]: { ...settings[key], subject: subjectDraft },
    };
    saveSettings(updated);
    setEditingSubject(null);
  }

  const totalPages = Math.max(1, Math.ceil(logTotal / 50));

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Email</h1>

      {/* Stats summary */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Sent" value={stats.total} />
          <StatCard label="Successful" value={stats.byStatus['sent'] ?? 0} />
          <StatCard label="Failed" value={stats.byStatus['failed'] ?? 0} />
          <StatCard label="Types" value={Object.keys(stats.byType).length} />
        </div>
      )}

      {/* Email Templates */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Email Templates</h2>
        <div className="space-y-3">
          {EMAIL_TYPES.map(({ key, label }) => (
            <div key={key} className="bg-bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-mono font-semibold text-text-primary">{label}</span>
                <button
                  onClick={() => toggleEnabled(key)}
                  disabled={saving}
                  className={`text-[10px] font-bold font-mono px-3 py-1 rounded transition-colors ${
                    settings[key].enabled
                      ? 'text-green bg-green-soft hover:opacity-80'
                      : 'text-text-muted bg-bg-elevated hover:opacity-80'
                  }`}
                >
                  {settings[key].enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider flex-shrink-0">Subject:</span>
                {editingSubject === key ? (
                  <>
                    <input
                      type="text"
                      value={subjectDraft}
                      onChange={e => setSubjectDraft(e.target.value)}
                      className="flex-1 bg-bg-elevated border border-border rounded px-2 py-1 text-xs font-mono text-text-primary focus:border-purple focus:outline-none"
                      autoFocus
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveSubject(key);
                        if (e.key === 'Escape') setEditingSubject(null);
                      }}
                    />
                    <button
                      onClick={() => saveSubject(key)}
                      className="text-xs font-mono text-green hover:underline"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSubject(null)}
                      className="text-xs font-mono text-text-muted hover:underline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-xs font-mono text-text-primary truncate">{settings[key].subject}</span>
                    <button
                      onClick={() => {
                        setEditingSubject(key);
                        setSubjectDraft(settings[key].subject);
                      }}
                      className="text-xs font-mono text-purple hover:underline flex-shrink-0"
                    >
                      Edit
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Send History */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-text-primary font-mono">Send History</h2>
          <select
            value={logTypeFilter}
            onChange={e => { setLogTypeFilter(e.target.value); setLogPage(1); }}
            className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
          >
            <option value="">All types</option>
            {EMAIL_TYPES.map(({ key, label }) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {logs.length === 0 ? (
          <div className="bg-bg-card rounded-xl border border-border p-6 text-center">
            <p className="text-text-muted text-sm font-mono">No emails sent yet.</p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Recipient</th>
                  <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden lg:table-cell">Subject</th>
                  <th className="text-center px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-20">Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30">
                    <td className="px-4 py-3 font-mono text-text-muted text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' '}
                      {new Date(log.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={log.emailType} />
                    </td>
                    <td className="px-4 py-3 font-mono text-text-primary text-xs truncate max-w-[180px] hidden md:table-cell">
                      {log.recipientEmail}
                    </td>
                    <td className="px-4 py-3 text-text-muted text-xs truncate max-w-[200px] hidden lg:table-cell">
                      {log.subject}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        log.status === 'sent'
                          ? 'text-green bg-green-soft'
                          : 'text-red bg-red-soft'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <span className="text-xs font-mono text-text-muted">{logTotal} total</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setLogPage(p => Math.max(1, p - 1))}
                    disabled={logPage <= 1}
                    className="px-2 py-1 text-xs font-mono text-text-muted hover:text-text-primary disabled:opacity-30"
                  >
                    Prev
                  </button>
                  <span className="text-xs font-mono text-text-muted">
                    {logPage}/{totalPages}
                  </span>
                  <button
                    onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                    disabled={logPage >= totalPages}
                    className="px-2 py-1 text-xs font-mono text-text-muted hover:text-text-primary disabled:opacity-30"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-semibold text-text-primary font-mono mt-1">{value}</p>
    </div>
  );
}

const TYPE_COLORS: Record<string, string> = {
  welcome: 'text-purple bg-purple-soft',
  verification: 'text-blue-400 bg-blue-400/10',
  password_reset: 'text-yellow bg-yellow/10',
  bug_submitted: 'text-green bg-green-soft',
};

function TypeBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? 'text-text-muted bg-bg-elevated';
  return (
    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded whitespace-nowrap ${color}`}>
      {type.replace('_', ' ')}
    </span>
  );
}
