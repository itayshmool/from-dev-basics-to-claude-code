import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/api';
import { applyTheme, clearTheme, type ThemeOverrides } from '../../utils/theme';

interface TokenDef {
  key: string;
  label: string;
  group: string;
}

const EDITABLE_TOKENS: TokenDef[] = [
  { key: '--color-bg-primary', label: 'Background Primary', group: 'Backgrounds' },
  { key: '--color-bg-secondary', label: 'Background Secondary', group: 'Backgrounds' },
  { key: '--color-bg-card', label: 'Card Background', group: 'Backgrounds' },
  { key: '--color-bg-elevated', label: 'Elevated Background', group: 'Backgrounds' },
  { key: '--color-text-primary', label: 'Text Primary', group: 'Text' },
  { key: '--color-text-secondary', label: 'Text Secondary', group: 'Text' },
  { key: '--color-text-muted', label: 'Text Muted', group: 'Text' },
  { key: '--color-purple', label: 'Accent (Orange)', group: 'Accent' },
  { key: '--color-green', label: 'Green / Success', group: 'Accent' },
  { key: '--color-blue', label: 'Blue', group: 'Accent' },
  { key: '--color-yellow', label: 'Yellow / Warning', group: 'Accent' },
  { key: '--color-red', label: 'Red / Error', group: 'Accent' },
  { key: '--color-border', label: 'Border', group: 'System' },
  { key: '--color-border-strong', label: 'Border Strong', group: 'System' },
];

const CSS_DEFAULTS: ThemeOverrides = {
  '--color-bg-primary': '#09090B',
  '--color-bg-secondary': '#0F0F13',
  '--color-bg-card': '#141419',
  '--color-bg-elevated': '#1C1C24',
  '--color-text-primary': '#EAEAEC',
  '--color-text-secondary': '#8E8E9E',
  '--color-text-muted': '#78788A',
  '--color-purple': '#FF6B35',
  '--color-green': '#22C55E',
  '--color-blue': '#3B82F6',
  '--color-yellow': '#EAB308',
  '--color-red': '#EF4444',
  '--color-border': 'rgba(255, 255, 255, 0.06)',
  '--color-border-strong': 'rgba(255, 255, 255, 0.12)',
};

function luminance(hex: string): number {
  const match = hex.match(/^#([0-9A-Fa-f]{6})$/);
  if (!match) return 0;
  const r = parseInt(match[1].slice(0, 2), 16) / 255;
  const g = parseInt(match[1].slice(2, 4), 16) / 255;
  const b = parseInt(match[1].slice(4, 6), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = Math.max(luminance(fg), luminance(bg));
  const L2 = Math.min(luminance(fg), luminance(bg));
  return (L1 + 0.05) / (L2 + 0.05);
}

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const isHex = /^#[0-9A-Fa-f]{6}$/.test(fg) && /^#[0-9A-Fa-f]{6}$/.test(bg);
  if (!isHex) return null;

  const ratio = contrastRatio(fg, bg);
  const label = ratio >= 4.5 ? 'AAA' : ratio >= 3 ? 'AA' : 'Fail';
  const color = ratio >= 4.5 ? '#22C55E' : ratio >= 3 ? '#EAB308' : '#EF4444';

  return (
    <span
      className="ml-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}22` }}
    >
      {ratio.toFixed(1)}:1 {label}
    </span>
  );
}

export function AdminThemeEditor() {
  const [overrides, setOverrides] = useState<ThemeOverrides>({});
  const [savedOverrides, setSavedOverrides] = useState<ThemeOverrides>({});
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load saved theme from API
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/admin/settings/theme');
        if (res.ok) {
          const data = await res.json();
          const saved = data.value as ThemeOverrides;
          setOverrides(saved);
          setSavedOverrides(saved);
        }
      } catch {
        // No saved theme yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live preview: apply overrides as they change
  useEffect(() => {
    if (Object.keys(overrides).length > 0) {
      applyTheme(overrides);
    }
  }, [overrides]);

  const getValue = useCallback(
    (key: string) => overrides[key] || CSS_DEFAULTS[key] || '',
    [overrides],
  );

  const handleChange = (key: string, value: string) => {
    setOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const hasChanges = JSON.stringify(overrides) !== JSON.stringify(savedOverrides);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await apiFetch('/api/admin/settings/theme', {
        method: 'PUT',
        body: JSON.stringify({ value: overrides }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedOverrides(overrides);
      setStatus('Saved! All users will see the new theme.');
    } catch {
      setStatus('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    // Remove custom theme from DB
    setSaving(true);
    try {
      await apiFetch('/api/admin/settings/theme', { method: 'DELETE' });
      clearTheme(Object.keys(overrides));
      setOverrides({});
      setSavedOverrides({});
      setStatus('Reset to defaults. Custom theme removed.');
    } catch {
      setStatus('Failed to reset.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-text-muted text-sm font-mono animate-pulse">Loading theme...</p>;
  }

  const groups = [...new Set(EDITABLE_TOKENS.map((t) => t.group))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary font-mono">Theme Editor</h1>
          <p className="text-xs text-text-muted font-mono mt-1">
            Changes preview live. Click Save to apply globally for all users.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 text-sm font-mono text-text-muted bg-bg-elevated border border-border rounded-lg hover:bg-bg-card transition-colors disabled:opacity-50"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="px-4 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save & Apply'}
          </button>
        </div>
      </div>

      {/* Status message */}
      {status && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-bg-elevated border border-border text-sm font-mono text-text-secondary">
          {status}
        </div>
      )}

      {/* Token groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group} className="bg-bg-card rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">{group}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EDITABLE_TOKENS.filter((t) => t.group === group).map((token) => {
                const val = getValue(token.key);
                const isColor = /^#[0-9A-Fa-f]{6}$/.test(val);
                const isTextToken = token.key.startsWith('--color-text-');
                const bgForContrast = getValue('--color-bg-primary');

                return (
                  <div key={token.key}>
                    <label className="flex items-center text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
                      {token.label}
                      {isTextToken && <ContrastBadge fg={val} bg={bgForContrast} />}
                    </label>
                    <div className="flex items-center gap-2">
                      {isColor && (
                        <input
                          type="color"
                          value={val}
                          onChange={(e) => handleChange(token.key, e.target.value)}
                          className="w-9 h-9 rounded-lg border border-border cursor-pointer bg-transparent shrink-0"
                        />
                      )}
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => handleChange(token.key, e.target.value)}
                        className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-xs text-text-primary focus:border-purple focus:outline-none"
                      />
                      {overrides[token.key] && (
                        <button
                          onClick={() => {
                            const next = { ...overrides };
                            delete next[token.key];
                            setOverrides(next);
                            document.documentElement.style.removeProperty(token.key);
                          }}
                          className="text-[10px] font-mono text-text-muted hover:text-text-primary shrink-0"
                          title="Reset to default"
                        >
                          undo
                        </button>
                      )}
                    </div>
                    <p className="text-[9px] font-mono text-text-muted mt-1 opacity-60">
                      {token.key}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview */}
      <div className="mt-6 bg-bg-card rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Live Preview</h2>
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: getValue('--color-bg-primary') }}
        >
          <div
            className="rounded-lg p-4 mb-3"
            style={{
              backgroundColor: getValue('--color-bg-card'),
              border: `1px solid ${getValue('--color-border')}`,
            }}
          >
            <p
              style={{
                color: getValue('--color-text-primary'),
                fontFamily: 'Monaco, monospace',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Level 0: Computers Are Not Magic
            </p>
            <p
              style={{
                color: getValue('--color-text-muted'),
                fontFamily: '-apple-system, sans-serif',
                fontSize: 12,
              }}
            >
              Understanding the basics before the terminal
            </p>

            {/* Progress bar */}
            <div className="mt-3 mb-2">
              <div
                className="h-1 rounded-full overflow-hidden"
                style={{ backgroundColor: getValue('--color-bg-elevated') }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: '66%', backgroundColor: getValue('--color-purple') }}
                />
              </div>
              <p
                className="mt-1"
                style={{
                  color: getValue('--color-text-muted'),
                  fontFamily: 'Monaco, monospace',
                  fontSize: 10,
                }}
              >
                4/6 lessons
              </p>
            </div>

            {/* Sample items */}
            {['What is a Computer?', 'Files and Folders'].map((title, i) => (
              <div
                key={i}
                className="flex justify-between items-center py-2"
                style={{
                  borderTop: i > 0 ? `1px solid ${getValue('--color-border')}` : 'none',
                }}
              >
                <span
                  style={{
                    color: getValue('--color-text-secondary'),
                    fontFamily: '-apple-system, sans-serif',
                    fontSize: 12,
                  }}
                >
                  {title}
                </span>
                <span style={{ color: getValue('--color-green'), fontSize: 13 }}>&#10003;</span>
              </div>
            ))}
          </div>

          {/* Accent button preview */}
          <button
            className="px-4 py-2 rounded-lg text-white text-sm font-mono"
            style={{ backgroundColor: getValue('--color-purple') }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
