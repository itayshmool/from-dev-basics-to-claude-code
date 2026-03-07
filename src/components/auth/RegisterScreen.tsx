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

    const normalizedUsername = username.trim();
    const normalizedDisplayName = displayName.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const passwordLower = password.toLowerCase();

    if (normalizedUsername.length < 3 || normalizedUsername.length > 100 || !/^[a-zA-Z0-9_]+$/.test(normalizedUsername)) {
      setError('Username must be 3–100 characters and use only letters, numbers, and underscores.');
      return;
    }

    if (!normalizedDisplayName) {
      setError('Display name cannot be empty or whitespace.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 255) {
      setError('Enter a valid email address.');
      return;
    }

    if (password.length > 128) {
      setError('Password is too long. Maximum is 128 characters.');
      return;
    }

    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password must be at least 8 characters and include at least 1 letter and 1 number.');
      return;
    }

    if (passwordLower.includes(normalizedUsername.toLowerCase()) || passwordLower.includes(normalizedEmail)) {
      setError('Password cannot contain your username or email.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await register(normalizedUsername.toLowerCase(), password, normalizedDisplayName, normalizedEmail);
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
              minLength={3}
              maxLength={100}
              pattern="[A-Za-z0-9_]+"
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
              maxLength={100}
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
              maxLength={255}
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
              maxLength={128}
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
