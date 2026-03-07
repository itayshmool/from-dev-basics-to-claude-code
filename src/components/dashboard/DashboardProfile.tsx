import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../services/api';

interface FullProfile {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  emailVerified: boolean;
  profileImage: string | null;
  role: string;
  createdAt: string;
}

function resizeImage(file: File, maxSize: number = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function DashboardProfile() {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Email
  const [editingEmail, setEditingEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  // Image upload
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setDisplayName(data.displayName);
          setEmail(data.email || '');
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

  async function handleSaveEmail() {
    setSavingEmail(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ email: email.trim() || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update');
      }
      const updated = await res.json();
      setProfile(prev => prev ? { ...prev, email: updated.email, emailVerified: false } : null);
      updateUser({ email: updated.email, emailVerified: false });
      setEditingEmail(false);
      setMessage({ type: 'success', text: email.trim() ? 'Email updated. Check your inbox for a verification link.' : 'Email removed.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to update.' });
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/email/resend-verification', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Failed to send' }));
        throw new Error(data.error || 'Failed to send');
      }
      setMessage({ type: 'success', text: 'Verification email sent. Check your inbox.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to send.' });
    } finally {
      setResendingVerification(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      setMessage({ type: 'error', text: 'Only JPEG, PNG, GIF, or WebP images are allowed.' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image is too large. Please choose a smaller file.' });
      return;
    }

    try {
      setUploadingImage(true);
      const resized = await resizeImage(file, 200);
      setImagePreview(resized);

      const res = await apiFetch('/api/auth/profile-image', {
        method: 'PUT',
        body: JSON.stringify({ image: resized }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }

      const data = await res.json();
      setProfile(prev => prev ? { ...prev, profileImage: data.profileImage } : null);
      updateUser({ profileImage: data.profileImage });
      setImagePreview(null);
      setMessage({ type: 'success', text: 'Profile image updated.' });
    } catch (e) {
      setImagePreview(null);
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Upload failed.' });
    } finally {
      setUploadingImage(false);
      // Reset file input so re-selecting same file triggers onChange
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemoveImage() {
    setMessage(null);
    try {
      const res = await apiFetch('/api/auth/profile-image', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove image');
      setProfile(prev => prev ? { ...prev, profileImage: null } : null);
      updateUser({ profileImage: null });
      setMessage({ type: 'success', text: 'Profile image removed.' });
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Failed to remove.' });
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

  const avatarSrc = imagePreview || profile.profileImage;

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
          <div className="relative flex-shrink-0">
            <div
              className="w-16 h-16 rounded-full bg-purple-soft border border-purple/20 flex items-center justify-center cursor-pointer group overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-purple text-2xl font-bold font-mono">{initial}</span>
              )}
              {/* Hover overlay */}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleImageSelect}
              className="hidden"
            />
              {profile.profileImage && (
                <button
                  onClick={handleRemoveImage}
                  className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-bg-elevated border border-border flex items-center justify-center text-text-muted hover:text-red transition-colors group"
                  title="Remove image"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    Remove image
                  </span>
                </button>
              )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text-muted">@{profile.username}</p>
          </div>
        </div>

        {/* Full Name */}
        <div className="mb-6">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">Full Name</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary focus:border-purple focus:outline-none"
                maxLength={100}
                placeholder="Your full name"
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
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-text-primary">
                {profile.displayName}
              </span>
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-mono text-purple hover:underline"
              >
                Edit
              </button>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="mb-6">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1">Email</p>
          {editingEmail ? (
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary focus:border-purple focus:outline-none"
                placeholder="your@email.com"
                autoFocus
              />
              <button
                onClick={handleSaveEmail}
                disabled={savingEmail}
                className="px-3 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {savingEmail ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditingEmail(false);
                  setEmail(profile.email || '');
                }}
                className="px-3 py-2 text-sm font-mono text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-mono text-text-primary">
                {profile.email || 'Not set'}
              </span>
              {profile.email && (
                <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                  profile.emailVerified
                    ? 'text-green bg-green-soft'
                    : 'text-yellow bg-yellow/10'
                }`}>
                  {profile.emailVerified ? 'Verified' : 'Unverified'}
                </span>
              )}
              <button
                onClick={() => setEditingEmail(true)}
                className="text-xs font-mono text-purple hover:underline"
              >
                Edit
              </button>
              {profile.email && !profile.emailVerified && (
                <button
                  onClick={handleResendVerification}
                  disabled={resendingVerification}
                  className="text-xs font-mono text-text-muted hover:text-purple transition-colors disabled:opacity-50"
                >
                  {resendingVerification ? 'Sending...' : 'Resend verification'}
                </button>
              )}
            </div>
          )}
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
