import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/api';
import { applyTheme, clearTheme, type ThemeOverrides } from '../../utils/theme';

/* ─── Token definitions ─── */

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

const DARK_DEFAULTS: ThemeOverrides = {
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

const LIGHT_DEFAULTS: ThemeOverrides = {
  '--color-bg-primary': '#FAFAF8',
  '--color-bg-secondary': '#F3F1EE',
  '--color-bg-card': '#FFFFFF',
  '--color-bg-elevated': '#EDECEA',
  '--color-text-primary': '#1A1A1B',
  '--color-text-secondary': '#5C5C61',
  '--color-text-muted': '#737380',
  '--color-purple': '#FF6B35',
  '--color-green': '#22C55E',
  '--color-blue': '#3B82F6',
  '--color-yellow': '#EAB308',
  '--color-red': '#EF4444',
  '--color-border': 'rgba(0, 0, 0, 0.08)',
  '--color-border-strong': 'rgba(0, 0, 0, 0.15)',
};

const FONT_SIZE_DEFAULTS = {
  '--font-size-body': '16',
  '--font-size-mono': '14',
};

/* ─── Contrast helpers ─── */

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
      className="ml-1 text-[9px] font-mono font-bold px-1 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}22` }}
    >
      {ratio.toFixed(1)} {label}
    </span>
  );
}

/* ─── State shape ─── */

interface DualState {
  dark: ThemeOverrides;
  light: ThemeOverrides;
}

interface FontState {
  '--font-size-body': string;
  '--font-size-mono': string;
}

/* ─── Preview card ─── */

function PreviewCard({
  mode,
  getVal,
  bodySize,
  monoSize,
}: {
  mode: 'dark' | 'light';
  getVal: (key: string) => string;
  bodySize: string;
  monoSize: string;
}) {
  return (
    <div className="flex-1 min-w-0">
      <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
        {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </p>
      <div className="rounded-xl p-5" style={{ backgroundColor: getVal('--color-bg-primary') }}>
        <div
          className="rounded-lg p-4 mb-3"
          style={{
            backgroundColor: getVal('--color-bg-card'),
            border: `1px solid ${getVal('--color-border')}`,
          }}
        >
          <p
            style={{
              color: getVal('--color-text-primary'),
              fontFamily: 'Monaco, monospace',
              fontSize: `${monoSize}px`,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Level 0: Computers Are Not Magic
          </p>
          <p
            style={{
              color: getVal('--color-text-muted'),
              fontFamily: '-apple-system, sans-serif',
              fontSize: `${bodySize}px`,
            }}
          >
            Understanding the basics before the terminal
          </p>

          <div className="mt-3 mb-2">
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: getVal('--color-bg-elevated') }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: '66%', backgroundColor: getVal('--color-purple') }}
              />
            </div>
            <p
              className="mt-1"
              style={{
                color: getVal('--color-text-muted'),
                fontFamily: 'Monaco, monospace',
                fontSize: 10,
              }}
            >
              4/6 lessons
            </p>
          </div>

          {['What is a Computer?', 'Files and Folders'].map((title, i) => (
            <div
              key={i}
              className="flex justify-between items-center py-2"
              style={{
                borderTop: i > 0 ? `1px solid ${getVal('--color-border')}` : 'none',
              }}
            >
              <span
                style={{
                  color: getVal('--color-text-secondary'),
                  fontFamily: '-apple-system, sans-serif',
                  fontSize: `${bodySize}px`,
                }}
              >
                {title}
              </span>
              <span style={{ color: getVal('--color-green'), fontSize: 13 }}>&#10003;</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            className="px-3 py-1.5 rounded-lg text-white text-sm font-mono"
            style={{ backgroundColor: getVal('--color-purple') }}
          >
            Continue
          </button>
          <button
            className="px-3 py-1.5 rounded-lg text-sm font-mono"
            style={{
              backgroundColor: getVal('--color-bg-elevated'),
              color: getVal('--color-text-secondary'),
              border: `1px solid ${getVal('--color-border')}`,
            }}
          >
            Settings
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Color input for one token in one mode ─── */

function TokenInput({
  value,
  onChange,
  onReset,
  hasOverride,
  showContrast,
  bgForContrast,
}: {
  value: string;
  onChange: (v: string) => void;
  onReset: () => void;
  hasOverride: boolean;
  showContrast: boolean;
  bgForContrast: string;
}) {
  const isColor = /^#[0-9A-Fa-f]{6}$/.test(value);

  return (
    <div className="flex items-center gap-1.5">
      {isColor && (
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent shrink-0"
        />
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 min-w-0 bg-bg-elevated border border-border rounded-lg px-2 py-1.5 font-mono text-[11px] text-text-primary focus:border-purple focus:outline-none"
      />
      {showContrast && <ContrastBadge fg={value} bg={bgForContrast} />}
      {hasOverride && (
        <button
          onClick={onReset}
          className="text-[9px] font-mono text-text-muted hover:text-text-primary shrink-0"
          title="Reset to default"
        >
          undo
        </button>
      )}
    </div>
  );
}

/* ─── Main editor ─── */

export function AdminThemeEditor() {
  const [overrides, setOverrides] = useState<DualState>({ dark: {}, light: {} });
  const [savedOverrides, setSavedOverrides] = useState<DualState>({ dark: {}, light: {} });
  const [fontSizes, setFontSizes] = useState<FontState>({ ...FONT_SIZE_DEFAULTS });
  const [savedFontSizes, setSavedFontSizes] = useState<FontState>({ ...FONT_SIZE_DEFAULTS });
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
          const saved = data.value;

          if (saved && typeof saved === 'object') {
            // New dual shape
            if (saved.dark || saved.light) {
              const dual: DualState = {
                dark: saved.dark || {},
                light: saved.light || {},
              };
              setOverrides(dual);
              setSavedOverrides(dual);

              const fonts: FontState = {
                '--font-size-body': saved['--font-size-body'] || FONT_SIZE_DEFAULTS['--font-size-body'],
                '--font-size-mono': saved['--font-size-mono'] || FONT_SIZE_DEFAULTS['--font-size-mono'],
              };
              setFontSizes(fonts);
              setSavedFontSizes(fonts);
            } else {
              // Legacy flat shape — treat as dark
              const dual: DualState = { dark: saved as ThemeOverrides, light: {} };
              setOverrides(dual);
              setSavedOverrides(dual);
            }
          }
        }
      } catch {
        // No saved theme yet
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Live preview on the actual page: apply the current mode's overrides
  useEffect(() => {
    const mode =
      document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    const modeOverrides = overrides[mode];
    if (Object.keys(modeOverrides).length > 0) {
      applyTheme(modeOverrides);
    }
    // Apply font sizes globally
    applyTheme({
      '--font-size-body': `${fontSizes['--font-size-body']}px`,
      '--font-size-mono': `${fontSizes['--font-size-mono']}px`,
    });
  }, [overrides, fontSizes]);

  const getVal = useCallback(
    (mode: 'dark' | 'light', key: string) => {
      const defaults = mode === 'dark' ? DARK_DEFAULTS : LIGHT_DEFAULTS;
      return overrides[mode][key] || defaults[key] || '';
    },
    [overrides],
  );

  const handleChange = (mode: 'dark' | 'light', key: string, value: string) => {
    setOverrides((prev) => ({
      ...prev,
      [mode]: { ...prev[mode], [key]: value },
    }));
  };

  const handleReset = (mode: 'dark' | 'light', key: string) => {
    setOverrides((prev) => {
      const next = { ...prev[mode] };
      delete next[key];
      document.documentElement.style.removeProperty(key);
      return { ...prev, [mode]: next };
    });
  };

  const hasChanges =
    JSON.stringify(overrides) !== JSON.stringify(savedOverrides) ||
    JSON.stringify(fontSizes) !== JSON.stringify(savedFontSizes);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      const payload = {
        ...overrides,
        '--font-size-body': fontSizes['--font-size-body'],
        '--font-size-mono': fontSizes['--font-size-mono'],
      };
      const res = await apiFetch('/api/admin/settings/theme', {
        method: 'PUT',
        body: JSON.stringify({ value: payload }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedOverrides(overrides);
      setSavedFontSizes(fontSizes);
      setStatus('Saved! All users will see the new theme.');
    } catch {
      setStatus('Failed to save. Check your connection.');
    } finally {
      setSaving(false);
    }
  }

  async function handleResetAll() {
    setSaving(true);
    try {
      await apiFetch('/api/admin/settings/theme', { method: 'DELETE' });
      // Clear all overridden keys from DOM
      const allKeys = [
        ...Object.keys(overrides.dark),
        ...Object.keys(overrides.light),
        '--font-size-body',
        '--font-size-mono',
      ];
      clearTheme(allKeys);
      setOverrides({ dark: {}, light: {} });
      setSavedOverrides({ dark: {}, light: {} });
      setFontSizes({ ...FONT_SIZE_DEFAULTS });
      setSavedFontSizes({ ...FONT_SIZE_DEFAULTS });
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
            Configure dark and light mode independently. Changes preview live.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleResetAll}
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

      {/* Status */}
      {status && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-bg-elevated border border-border text-sm font-mono text-text-secondary">
          {status}
        </div>
      )}

      {/* Typography */}
      <div className="bg-bg-card rounded-xl border border-border p-6 mb-6">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Typography</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {([
            { key: '--font-size-body' as const, label: 'Body Font Size', min: 12, max: 22 },
            { key: '--font-size-mono' as const, label: 'Code Font Size', min: 10, max: 20 },
          ] as const).map(({ key, label, min, max }) => (
            <div key={key}>
              <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2 block">
                {label}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={min}
                  max={max}
                  value={fontSizes[key]}
                  onChange={(e) =>
                    setFontSizes((prev) => ({ ...prev, [key]: e.target.value }))
                  }
                  className="flex-1 accent-purple"
                />
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={fontSizes[key]}
                    onChange={(e) =>
                      setFontSizes((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="w-14 bg-bg-elevated border border-border rounded-lg px-2 py-1.5 font-mono text-xs text-text-primary text-center focus:border-purple focus:outline-none"
                  />
                  <span className="text-[10px] font-mono text-text-muted">px</span>
                </div>
                {fontSizes[key] !== FONT_SIZE_DEFAULTS[key] && (
                  <button
                    onClick={() =>
                      setFontSizes((prev) => ({
                        ...prev,
                        [key]: FONT_SIZE_DEFAULTS[key],
                      }))
                    }
                    className="text-[9px] font-mono text-text-muted hover:text-text-primary"
                  >
                    undo
                  </button>
                )}
              </div>
              <p className="text-[9px] font-mono text-text-muted mt-1 opacity-60">{key}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Color token groups — side by side dark/light */}
      <div className="space-y-6">
        {groups.map((group) => {
          const tokens = EDITABLE_TOKENS.filter((t) => t.group === group);
          return (
            <div key={group} className="bg-bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">{group}</h2>

              {/* Column headers */}
              <div className="grid grid-cols-2 gap-6 mb-3">
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Dark Mode
                </p>
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">
                  Light Mode
                </p>
              </div>

              {/* Token rows */}
              <div className="space-y-4">
                {tokens.map((token) => {
                  const isTextToken = token.key.startsWith('--color-text-');
                  return (
                    <div key={token.key}>
                      <p className="text-[10px] font-mono text-text-muted mb-1.5">
                        {token.label}{' '}
                        <span className="opacity-50">{token.key}</span>
                      </p>
                      <div className="grid grid-cols-2 gap-6">
                        {/* Dark */}
                        <TokenInput
                          value={getVal('dark', token.key)}
                          onChange={(v) => handleChange('dark', token.key, v)}
                          onReset={() => handleReset('dark', token.key)}
                          hasOverride={!!overrides.dark[token.key]}
                          showContrast={isTextToken}
                          bgForContrast={getVal('dark', '--color-bg-primary')}
                        />
                        {/* Light */}
                        <TokenInput
                          value={getVal('light', token.key)}
                          onChange={(v) => handleChange('light', token.key, v)}
                          onReset={() => handleReset('light', token.key)}
                          hasOverride={!!overrides.light[token.key]}
                          showContrast={isTextToken}
                          bgForContrast={getVal('light', '--color-bg-primary')}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-side Live Preview */}
      <div className="mt-6 bg-bg-card rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Live Preview</h2>
        <div className="flex gap-6">
          <PreviewCard
            mode="dark"
            getVal={(key) => getVal('dark', key)}
            bodySize={fontSizes['--font-size-body']}
            monoSize={fontSizes['--font-size-mono']}
          />
          <PreviewCard
            mode="light"
            getVal={(key) => getVal('light', key)}
            bodySize={fontSizes['--font-size-body']}
            monoSize={fontSizes['--font-size-mono']}
          />
        </div>
      </div>
    </div>
  );
}
