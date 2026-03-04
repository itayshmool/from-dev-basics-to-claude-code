import { useState } from 'react';
import { apiFetch } from '../../services/api';

export function DashboardSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const isValid = currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password changed successfully.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to change password.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Settings</h1>

      <div className="bg-bg-card rounded-xl border border-border p-6 max-w-md">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Change Password</h2>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary font-mono focus:border-purple focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary font-mono focus:border-purple focus:outline-none"
              minLength={8}
            />
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-[10px] font-mono text-red mt-1">Must be at least 8 characters</p>
            )}
          </div>

          <div>
            <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-bg-elevated border border-border rounded-lg px-4 py-3 text-sm text-text-primary font-mono focus:border-purple focus:outline-none"
            />
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-[10px] font-mono text-red mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={saving || !isValid}
            className="w-full px-4 py-3 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
