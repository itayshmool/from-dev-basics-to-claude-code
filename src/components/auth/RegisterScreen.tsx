import { useState, type FormEvent } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
      await register(username, password, displayName, email);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
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
          <h1 className="text-2xl font-semibold text-text-primary font-mono">Create account</h1>
          <p className="text-sm text-text-muted mt-1">Start your terminal training journey</p>
        </div>

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

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
              placeholder="Your Name"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple/30"
              placeholder="8+ characters"
              required
              minLength={8}
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
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-purple font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
