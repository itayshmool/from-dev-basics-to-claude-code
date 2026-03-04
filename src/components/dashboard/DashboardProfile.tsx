import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../services/api';

interface FullProfile {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
}

export function DashboardProfile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setDisplayName(data.displayName);
        }
      } catch {
        // Failed to load profile
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave() {
    if (!displayName.trim()) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update');
      }
      const updated = await res.json();
      setProfile(prev => prev ? { ...prev, displayName: updated.displayName } : null);
      updateUser({ displayName: updated.displayName });
      setEditing(false);
      setMessage({ type: 'success', text: 'Display name updated.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update.' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-text-muted text-sm font-mono animate-pulse">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="text-text-muted text-sm font-mono">Failed to load profile.</p>;
  }

  const initial = profile.displayName.charAt(0).toUpperCase();
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Profile</h1>

      {message && (
        <div
          className={`mb-4 px-4 py-2 rounded-lg border text-sm font-mono ${
            message.type === 'success'
              ? 'bg-green-soft border-green/20 text-green'
              : 'bg-red-soft border-red/20 text-red'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-bg-card rounded-xl border border-border p-6">
        {/* Avatar + Name */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-purple-soft border border-purple/20 flex items-center justify-center flex-shrink-0">
            <span className="text-purple text-2xl font-bold font-mono">{initial}</span>
          </div>
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary focus:border-purple focus:outline-none"
                  maxLength={100}
                  autoFocus
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !displayName.trim()}
                  className="px-3 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setDisplayName(profile.displayName);
                  }}
                  className="px-3 py-2 text-sm font-mono text-text-muted hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary font-mono">
                  {profile.displayName}
                </h2>
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-mono text-purple hover:underline"
                >
                  Edit
                </button>
              </div>
            )}
            <p className="text-sm text-text-muted mt-1">@{profile.username}</p>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-bg-elevated rounded-lg p-4">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">Role</p>
            <p className="text-sm font-mono text-text-primary capitalize">{profile.role}</p>
          </div>
          <div className="bg-bg-elevated rounded-lg p-4">
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">Member Since</p>
            <p className="text-sm font-mono text-text-primary">{memberSince}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
