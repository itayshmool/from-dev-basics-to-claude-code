import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../../services/api';

export function VerifyEmailScreen() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Invalid verification link. No token provided.');
      return;
    }

    apiFetch('/api/email/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: 'Verification failed' }));
          throw new Error(data.error || 'Verification failed');
        }
        setStatus('success');
      })
      .catch(err => {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Verification failed');
      });
  }, [token]);

  return (
    <div className="h-full flex items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-lg bg-purple-soft border border-purple/20 flex items-center justify-center mx-auto mb-6">
          <span className="text-purple text-lg font-bold font-mono">&gt;_</span>
        </div>

        {status === 'loading' && (
          <p className="text-sm text-text-muted font-mono">Verifying your email...</p>
        )}

        {status === 'success' && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary font-mono mb-2">Email verified!</h1>
            <p className="text-sm text-text-muted mb-6">Your email address has been confirmed.</p>
            <Link to="/dashboard/profile" className="text-sm text-purple font-medium hover:underline">
              Go to your profile
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h1 className="text-2xl font-semibold text-text-primary font-mono mb-2">Verification failed</h1>
            <p className="text-sm text-red mb-6">{error}</p>
            <Link to="/dashboard/profile" className="text-sm text-purple font-medium hover:underline">
              Go to your profile
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
