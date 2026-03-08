import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/api';

interface EventConfig {
  enabled: boolean;
  mode: 'immediate' | 'digest';
}

interface NotificationConfig {
  recipients: string[];
  events: Record<string, EventConfig>;
}

interface QueueEntry {
  id: number;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  processedAt: string | null;
}

const EVENT_LABELS: Record<string, string> = {
  student_joined: 'New Student Joined',
  bug_report: 'Bug Report Filed',
};

export function AdminNotifications() {
  const useApi = import.meta.env.VITE_USE_API === 'true';

  if (!useApi) {
    return (
      <div className="text-center py-20">
        <p className="text-text-muted text-sm">Notifications require the backend API.</p>
      </div>
    );
  }

  return <NotificationsPage />;
}

function NotificationsPage() {
  const [config, setConfig] = useState<NotificationConfig | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [digestResult, setDigestResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [configRes, queueRes] = await Promise.all([
        apiFetch('/api/admin/notifications/config'),
        apiFetch('/api/admin/notifications/queue'),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (queueRes.ok) {
        const data = await queueRes.json();
        setQueue(data.entries);
      }
    } catch {
      setError('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiFetch('/api/admin/notifications/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error('Save failed');
      setSuccess('Settings saved');
      setTimeout(() => setSuccess(''), 3000);
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  function addRecipient() {
    if (!config || !newEmail.trim()) return;
    const email = newEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email address');
      return;
    }
    if (config.recipients.includes(email)) {
      setError('Email already added');
      return;
    }
    setConfig({ ...config, recipients: [...config.recipients, email] });
    setNewEmail('');
    setError('');
  }

  function removeRecipient(email: string) {
    if (!config) return;
    setConfig({ ...config, recipients: config.recipients.filter(r => r !== email) });
  }

  function updateEvent(eventType: string, field: 'enabled' | 'mode', value: boolean | string) {
    if (!config) return;
    const current = config.events[eventType] || { enabled: true, mode: 'immediate' as const };
    setConfig({
      ...config,
      events: {
        ...config.events,
        [eventType]: { ...current, [field]: value },
      },
    });
  }

  async function triggerDigest() {
    setDigestResult(null);
    try {
      const res = await apiFetch('/api/admin/notifications/digest', { method: 'POST' });
      const data = await res.json();
      setDigestResult(`Processed ${data.processed} event${data.processed === 1 ? '' : 's'}`);
      fetchData();
    } catch {
      setDigestResult('Failed to trigger digest');
    }
  }

  if (isLoading) {
    return <div className="text-center py-20"><p className="text-text-muted text-sm">Loading...</p></div>;
  }

  if (!config) {
    return <div className="text-center py-20"><p className="text-text-muted text-sm">Failed to load config</p></div>;
  }

  const eventTypes = Object.keys(EVENT_LABELS);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono text-text-primary">Notifications</h1>
          <p className="text-sm text-text-muted mt-1">Configure admin email notifications for system events</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-purple text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Recipients */}
      <section className="rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-sm font-semibold font-mono text-text-primary mb-4">Recipients</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addRecipient()}
            placeholder="admin@example.com"
            className="flex-1 px-3 py-2 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple"
          />
          <button
            onClick={addRecipient}
            className="px-4 py-2 rounded-lg bg-bg-elevated border border-border text-sm text-text-primary hover:bg-bg-card transition-colors"
          >
            Add
          </button>
        </div>
        {config.recipients.length === 0 ? (
          <p className="text-xs text-text-muted">No recipients configured. Add an email to enable notifications.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {config.recipients.map(email => (
              <span key={email} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-elevated border border-border text-sm text-text-secondary">
                {email}
                <button
                  onClick={() => removeRecipient(email)}
                  className="text-text-muted hover:text-red-400 transition-colors"
                  aria-label={`Remove ${email}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Event Settings */}
      <section className="rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-sm font-semibold font-mono text-text-primary mb-4">Event Settings</h2>
        <div className="space-y-4">
          {eventTypes.map(eventType => {
            const eventConfig = config.events[eventType] || { enabled: true, mode: 'immediate' };
            return (
              <div key={eventType} className="flex items-center justify-between gap-4 p-4 rounded-lg bg-bg-elevated border border-border/50">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateEvent(eventType, 'enabled', !eventConfig.enabled)}
                    className={`relative w-10 h-6 rounded-full transition-colors ${eventConfig.enabled ? 'bg-purple' : 'bg-bg-card border border-border'}`}
                    aria-label={`Toggle ${EVENT_LABELS[eventType]}`}
                  >
                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${eventConfig.enabled ? 'translate-x-4' : ''}`} />
                  </button>
                  <span className="text-sm font-medium text-text-primary">{EVENT_LABELS[eventType]}</span>
                </div>
                {eventConfig.enabled && (
                  <div className="flex gap-1 rounded-lg border border-border overflow-hidden">
                    <button
                      onClick={() => updateEvent(eventType, 'mode', 'immediate')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${eventConfig.mode === 'immediate' ? 'bg-purple text-white' : 'bg-bg-card text-text-muted hover:text-text-primary'}`}
                    >
                      Immediate
                    </button>
                    <button
                      onClick={() => updateEvent(eventType, 'mode', 'digest')}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-border ${eventConfig.mode === 'digest' ? 'bg-purple text-white' : 'bg-bg-card text-text-muted hover:text-text-primary'}`}
                    >
                      Daily Digest
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Digest Controls */}
      <section className="rounded-xl border border-border bg-bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold font-mono text-text-primary">Digest</h2>
          <button
            onClick={triggerDigest}
            className="px-3 py-1.5 rounded-lg bg-bg-elevated border border-border text-xs font-medium text-text-primary hover:bg-bg-card transition-colors"
          >
            Process Now
          </button>
        </div>
        {digestResult && (
          <p className="text-xs text-text-muted">{digestResult}</p>
        )}
      </section>

      {/* Recent Events Queue */}
      <section className="rounded-xl border border-border bg-bg-card p-6">
        <h2 className="text-sm font-semibold font-mono text-text-primary mb-4">Recent Events</h2>
        {queue.length === 0 ? (
          <p className="text-xs text-text-muted">No events in queue</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider">Type</th>
                  <th className="pb-2 text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider">Summary</th>
                  <th className="pb-2 text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider">Created</th>
                  <th className="pb-2 text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(entry => (
                  <tr key={entry.id} className="border-b border-border/50">
                    <td className="py-2.5 text-xs text-text-secondary">
                      {EVENT_LABELS[entry.eventType] || entry.eventType}
                    </td>
                    <td className="py-2.5 text-xs text-text-muted max-w-[200px] truncate">
                      {summarizePayload(entry.eventType, entry.payload)}
                    </td>
                    <td className="py-2.5 text-xs text-text-muted tabular-nums">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${entry.processedAt ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                        {entry.processedAt ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function summarizePayload(eventType: string, payload: Record<string, unknown>): string {
  switch (eventType) {
    case 'student_joined':
      return `${payload.displayName}${payload.email ? ` (${payload.email})` : ''}`;
    case 'bug_report':
      return `${payload.title}`;
    default:
      return JSON.stringify(payload).slice(0, 80);
  }
}
