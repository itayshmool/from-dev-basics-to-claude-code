import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export function ForgotPasswordScreen() {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiFetch('/api/email/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(data.error || 'Request failed');
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-lg bg-purple-soft border border-purple/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-purple text-lg font-bold font-mono">&gt;_</span>
          </div>
          <h1 className="text-2xl font-semibold text-text-primary font-mono">Forgot password</h1>
          <p className="text-sm text-text-muted mt-1">Enter your username and we'll send a reset link</p>
        </div>

        {submitted ? (
          <div className="bg-bg-card border border-border rounded-xl p-6 text-center">
            <p className="text-sm text-text-primary mb-4">
              If an account with that username exists and has an email address, we've sent a password reset link.
            </p>
            <Link to="/login" className="text-sm text-purple font-medium hover:underline">
              Back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-red bg-red-soft px-3 py-2 rounded-lg">{error}</div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
                placeholder="your_username"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-purple text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send reset link'}
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
