import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export function ResetPasswordScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/email/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, newPassword: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Reset failed' }));
        throw new Error(data.error || 'Reset failed');
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="h-full flex items-center justify-center bg-bg-primary px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm text-red mb-4">Invalid reset link. No token provided.</p>
          <Link to="/forgot-password" className="text-sm text-purple font-medium hover:underline">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-purple-soft border border-purple/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-purple text-lg font-bold font-mono">&gt;_</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary font-mono">Reset password</h1>
          <p className="text-sm text-text-muted mt-1">Choose a new password</p>
        </div>

        {success ? (
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-text-primary mb-4">
              Your password has been reset successfully.
            </p>
            <Link to="/login" className="text-sm text-purple font-medium hover:underline">
              Log in with your new password
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red bg-red-soft px-3 py-2 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
                placeholder="8+ characters"
                required
                minLength={8}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
                placeholder="********"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-muted mt-6">
          <Link to="/login" className="text-purple font-medium hover:underline">Back to login</Link>
        </p>
      </div>
    </div>
  );
}
