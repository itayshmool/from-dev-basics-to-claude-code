import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { useTheme, type Palette } from '../../hooks/useTheme';
import { fetchPalettes, getActivePalette } from '../../utils/theme';

function PaletteCard({ palette, isSelected, onSelect }: {
  palette: Palette;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const swatchColors = [
    palette.colors.dark['--color-bg-primary'],
    palette.colors.dark['--color-bg-card'],
    palette.colors.dark['--color-purple'],
    palette.colors.dark['--color-green'],
    palette.colors.dark['--color-text-primary'],
  ];

  return (
    <button
      onClick={onSelect}
      className={`
        relative flex flex-col gap-3 p-4 rounded-xl border transition-all text-left
        ${isSelected
          ? 'border-purple bg-purple-soft ring-1 ring-purple/30'
          : 'border-border bg-bg-card hover:border-border-strong hover:bg-bg-elevated/50'
        }
      `}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      <span className="text-sm font-mono font-medium text-text-primary">{palette.name}</span>
      <div className="flex gap-1.5">
        {swatchColors.map((color, i) => (
          <div
            key={i}
            className="w-6 h-6 rounded-full border border-border-strong/50"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </button>
  );
}

export function DashboardSettings() {
  const { setPalette, resetPalette } = useTheme();
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loadingPalettes, setLoadingPalettes] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchPalettes().then((data) => {
      setPalettes(data);
      setLoadingPalettes(false);
    });
  }, []);

  const activePalette = getActivePalette();
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

  const defaultPalette = palettes.find(p => p.isDefault);
  const isUsingDefault = !activePalette || activePalette.isDefault;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Settings</h1>

      {/* Palette Picker */}
      <div className="bg-bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Color Palette</h2>

        {loadingPalettes ? (
          <p className="text-text-muted text-sm font-mono animate-pulse">Loading palettes...</p>
        ) : palettes.length === 0 ? (
          <p className="text-text-muted text-sm font-mono">No palettes available.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {palettes.map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  isSelected={activePalette?.slug === palette.slug}
                  onSelect={() => setPalette(palette.slug)}
                />
              ))}
            </div>
            {!isUsingDefault && (
              <button
                onClick={resetPalette}
                className="mt-3 text-xs font-mono text-purple hover:underline"
              >
                Reset to default ({defaultPalette?.name || 'Terminal Noir'})
              </button>
            )}
          </>
        )}
      </div>

      {/* Password Change */}
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
