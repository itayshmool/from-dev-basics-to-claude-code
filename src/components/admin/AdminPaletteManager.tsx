import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../../services/api';

/* ─── Types ─── */

interface PaletteColors {
  dark: Record<string, string>;
  light: Record<string, string>;
}

interface Palette {
  id: string;
  name: string;
  slug: string;
  colors: PaletteColors;
  isDefault: boolean;
  isActive: boolean;
  order: number;
}

/* ─── Token definitions (same 14 tokens as theme editor) ─── */

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

const SWATCH_KEYS = [
  '--color-bg-primary',
  '--color-purple',
  '--color-green',
  '--color-text-primary',
  '--color-bg-card',
];

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

/* ─── Token input ─── */

function TokenInput({
  value,
  onChange,
  showContrast,
  bgForContrast,
}: {
  value: string;
  onChange: (v: string) => void;
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
    </div>
  );
}

/* ─── Preview card (mini) ─── */

function PalettePreviewCard({ colors }: { colors: PaletteColors }) {
  const dark = colors.dark || {};
  const bg = dark['--color-bg-primary'] || '#09090B';
  const card = dark['--color-bg-card'] || '#141419';
  const textP = dark['--color-text-primary'] || '#EAEAEC';
  const textM = dark['--color-text-muted'] || '#78788A';
  const accent = dark['--color-purple'] || '#FF6B35';
  const border = dark['--color-border'] || 'rgba(255,255,255,0.06)';

  return (
    <div className="rounded-lg p-3 w-full max-w-xs" style={{ backgroundColor: bg }}>
      <div
        className="rounded-md p-2.5 mb-2"
        style={{ backgroundColor: card, border: `1px solid ${border}` }}
      >
        <p style={{ color: textP, fontFamily: 'Monaco, monospace', fontSize: 11, fontWeight: 600 }}>
          Sample Lesson
        </p>
        <p style={{ color: textM, fontSize: 10 }}>
          Understanding the basics
        </p>
        <div
          className="mt-2 h-1 rounded-full overflow-hidden"
          style={{ backgroundColor: `${textM}33` }}
        >
          <div className="h-full rounded-full" style={{ width: '66%', backgroundColor: accent }} />
        </div>
      </div>
      <div
        className="inline-block px-2 py-1 rounded text-[10px] font-mono text-white"
        style={{ backgroundColor: accent }}
      >
        Continue
      </div>
    </div>
  );
}

/* ─── Slug helper ─── */

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

/* ─── Empty palette template ─── */

function emptyPalette(): Omit<Palette, 'id'> {
  return {
    name: '',
    slug: '',
    colors: { dark: {}, light: {} },
    isDefault: false,
    isActive: true,
    order: 0,
  };
}

/* ─── Main component ─── */

export function AdminPaletteManager() {
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editing, setEditing] = useState<Palette | null>(null);
  const [editForm, setEditForm] = useState<Omit<Palette, 'id'> & { id?: string }>(emptyPalette());
  const [isNew, setIsNew] = useState(false);

  // AI generate state
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateHint, setGenerateHint] = useState('');
  const [generating, setGenerating] = useState(false);

  // Load palettes
  useEffect(() => {
    (async () => {
      try {
        const res = await apiFetch('/api/admin/palettes');
        if (res.ok) {
          setPalettes(await res.json());
        }
      } catch {
        setStatus('Failed to load palettes.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasChanges = editing
    ? JSON.stringify(editForm) !== JSON.stringify({
        id: editing.id,
        name: editing.name,
        slug: editing.slug,
        colors: editing.colors,
        isDefault: editing.isDefault,
        isActive: editing.isActive,
        order: editing.order,
      })
    : isNew;

  const getColorVal = useCallback(
    (mode: 'dark' | 'light', key: string) => {
      return editForm.colors[mode][key] || '';
    },
    [editForm],
  );

  function handleColorChange(mode: 'dark' | 'light', key: string, value: string) {
    setEditForm((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [mode]: { ...prev.colors[mode], [key]: value },
      },
    }));
  }

  function startCreate() {
    const maxOrder = palettes.reduce((max, p) => Math.max(max, p.order), -1);
    setEditing(null);
    setEditForm({ ...emptyPalette(), order: maxOrder + 1 });
    setIsNew(true);
    setStatus(null);
  }

  async function handleGenerate() {
    setGenerating(true);
    setStatus(null);
    try {
      const res = await apiFetch('/api/admin/palettes/generate', {
        method: 'POST',
        body: JSON.stringify({ hint: generateHint || undefined }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Generation failed' }));
        throw new Error(err.error || 'Generation failed');
      }
      const result: { name: string; dark: Record<string, string>; light: Record<string, string> } =
        await res.json();

      // Pre-fill editor with generated palette
      const maxOrder = palettes.reduce((max, p) => Math.max(max, p.order), -1);
      setEditing(null);
      setEditForm({
        name: result.name,
        slug: toSlug(result.name),
        colors: { dark: result.dark, light: result.light },
        isDefault: false,
        isActive: true,
        order: maxOrder + 1,
      });
      setIsNew(true);
      setShowGenerate(false);
      setGenerateHint('');
      setStatus(`AI generated "${result.name}". Review the colors and save when ready.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  }

  function startEdit(palette: Palette) {
    setEditing(palette);
    setEditForm({
      id: palette.id,
      name: palette.name,
      slug: palette.slug,
      colors: { dark: { ...palette.colors.dark }, light: { ...palette.colors.light } },
      isDefault: palette.isDefault,
      isActive: palette.isActive,
      order: palette.order,
    });
    setIsNew(false);
    setStatus(null);
  }

  function cancelEdit() {
    setEditing(null);
    setIsNew(false);
    setStatus(null);
  }

  async function handleSave() {
    if (!editForm.name.trim()) {
      setStatus('Name is required.');
      return;
    }
    if (!editForm.slug.trim()) {
      setStatus('Slug is required.');
      return;
    }

    setSaving(true);
    setStatus(null);
    try {
      if (isNew) {
        const res = await apiFetch('/api/admin/palettes', {
          method: 'POST',
          body: JSON.stringify({
            name: editForm.name,
            slug: editForm.slug,
            colors: editForm.colors,
            isActive: editForm.isActive,
            order: editForm.order,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Create failed' }));
          throw new Error(err.error || 'Create failed');
        }
        const created: Palette = await res.json();
        setPalettes((prev) => [...prev, created].sort((a, b) => a.order - b.order));
        setStatus(`Palette "${created.name}" created.`);
      } else {
        const res = await apiFetch(`/api/admin/palettes/${editForm.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: editForm.name,
            slug: editForm.slug,
            colors: editForm.colors,
            isActive: editForm.isActive,
            order: editForm.order,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Update failed' }));
          throw new Error(err.error || 'Update failed');
        }
        const updated: Palette = await res.json();
        setPalettes((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p)).sort((a, b) => a.order - b.order),
        );
        setStatus(`Palette "${updated.name}" saved.`);
      }
      setEditing(null);
      setIsNew(false);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(palette: Palette) {
    if (palette.isDefault) {
      setStatus('Cannot delete the default palette.');
      return;
    }
    if (!window.confirm(`Delete palette "${palette.name}"? Users who selected it will be reset to default.`)) {
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/palettes/${palette.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Delete failed' }));
        throw new Error(err.error || 'Delete failed');
      }
      setPalettes((prev) => prev.filter((p) => p.id !== palette.id));
      if (editing?.id === palette.id) cancelEdit();
      setStatus(`Palette "${palette.name}" deleted.`);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Delete failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSetDefault(palette: Palette) {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/palettes/${palette.id}/default`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed to set default');
      setPalettes((prev) =>
        prev.map((p) => ({ ...p, isDefault: p.id === palette.id })),
      );
      setStatus(`"${palette.name}" is now the default palette.`);
    } catch {
      setStatus('Failed to set default.');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(palette: Palette) {
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/palettes/${palette.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !palette.isActive }),
      });
      if (!res.ok) throw new Error('Failed to toggle');
      const updated: Palette = await res.json();
      setPalettes((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } catch {
      setStatus('Failed to toggle active state.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-text-muted text-sm font-mono animate-pulse">Loading palettes...</p>;
  }

  const showEditor = editing !== null || isNew;
  const groups = [...new Set(EDITABLE_TOKENS.map((t) => t.group))];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-text-primary font-mono">Palette Manager</h1>
          <p className="text-xs text-text-muted font-mono mt-1">
            Create and manage color palettes for your users.
          </p>
        </div>
        {!showEditor && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowGenerate(true)}
              disabled={generating}
              className="px-4 py-2 text-sm font-mono text-text-primary bg-bg-elevated border border-border rounded-lg hover:bg-bg-card transition-colors disabled:opacity-50"
            >
              {generating ? 'Generating...' : 'Generate with AI'}
            </button>
            <button
              onClick={startCreate}
              className="px-4 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity"
            >
              Create Palette
            </button>
          </div>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-bg-elevated border border-border text-sm font-mono text-text-secondary">
          {status}
        </div>
      )}

      {/* AI Generate modal */}
      {showGenerate && (
        <div className="mb-6 bg-bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary font-mono">Generate with AI</h2>
            <button
              onClick={() => { setShowGenerate(false); setGenerateHint(''); }}
              className="text-xs font-mono text-text-muted hover:text-text-primary"
            >
              cancel
            </button>
          </div>
          <p className="text-xs text-text-muted font-mono mb-3">
            Describe the mood or style you want (optional). The AI will generate a full color palette.
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={generateHint}
              onChange={(e) => setGenerateHint(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !generating) handleGenerate(); }}
              placeholder='e.g. "warm sunset", "cyberpunk neon", "calm ocean"'
              className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted/50 focus:border-purple focus:outline-none"
            />
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
            >
              {generating ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </div>
      )}

      {showEditor ? (
        /* ─── Editor ─── */
        <div>
          {/* Editor header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary font-mono">
              {isNew ? 'New Palette' : `Edit: ${editing!.name}`}
            </h2>
            <div className="flex gap-2">
              {isNew && Object.keys(editForm.colors.dark).length > 0 && (
                <button
                  onClick={() => { setShowGenerate(true); cancelEdit(); }}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-mono text-text-muted bg-bg-elevated border border-border rounded-lg hover:bg-bg-card transition-colors disabled:opacity-50"
                >
                  Regenerate
                </button>
              )}
              <button
                onClick={cancelEdit}
                disabled={saving}
                className="px-4 py-2 text-sm font-mono text-text-muted bg-bg-elevated border border-border rounded-lg hover:bg-bg-card transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !hasChanges}
                className="px-4 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
              </button>
            </div>
          </div>

          {/* Name + Slug */}
          <div className="bg-bg-card rounded-xl border border-border p-6 mb-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditForm((prev) => ({
                      ...prev,
                      name,
                      slug: isNew ? toSlug(name) : prev.slug,
                    }));
                  }}
                  placeholder="e.g. Midnight Ocean"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary focus:border-purple focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider block mb-1.5">
                  Slug
                </label>
                <input
                  type="text"
                  value={editForm.slug}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g. midnight-ocean"
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary focus:border-purple focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-mono text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                  className="accent-purple"
                />
                Active (visible to users)
              </label>
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider mr-2">
                  Order
                </label>
                <input
                  type="number"
                  value={editForm.order}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                  className="w-16 bg-bg-elevated border border-border rounded-lg px-2 py-1.5 font-mono text-xs text-text-primary text-center focus:border-purple focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color tokens */}
          <div className="space-y-6">
            {groups.map((group) => {
              const tokens = EDITABLE_TOKENS.filter((t) => t.group === group);
              return (
                <div key={group} className="bg-bg-card rounded-xl border border-border p-6">
                  <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">{group}</h2>
                  <div className="grid grid-cols-2 gap-6 mb-3">
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Dark Mode</p>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Light Mode</p>
                  </div>
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
                            <TokenInput
                              value={getColorVal('dark', token.key)}
                              onChange={(v) => handleColorChange('dark', token.key, v)}
                              showContrast={isTextToken}
                              bgForContrast={getColorVal('dark', '--color-bg-primary')}
                            />
                            <TokenInput
                              value={getColorVal('light', token.key)}
                              onChange={(v) => handleColorChange('light', token.key, v)}
                              showContrast={isTextToken}
                              bgForContrast={getColorVal('light', '--color-bg-primary')}
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

          {/* Preview */}
          <div className="mt-6 bg-bg-card rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">Preview</h2>
            <div className="flex gap-6">
              <div className="flex-1">
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">Dark Mode</p>
                <PalettePreviewCard colors={editForm.colors} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">Light Mode</p>
                <PalettePreviewCard colors={{ dark: editForm.colors.light, light: {} }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ─── List view ─── */
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Palette</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Slug</th>
                <th className="text-center px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Order</th>
                <th className="text-center px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {palettes.map((palette) => (
                <tr
                  key={palette.id}
                  className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {/* Color swatches */}
                      <div className="flex gap-1">
                        {SWATCH_KEYS.map((key) => (
                          <div
                            key={key}
                            className="w-5 h-5 rounded-full border border-border"
                            style={{ backgroundColor: palette.colors.dark?.[key] || '#333' }}
                          />
                        ))}
                      </div>
                      <div>
                        <span className="font-mono text-text-primary text-sm">{palette.name}</span>
                        {palette.isDefault && (
                          <span className="ml-2 text-[9px] font-mono font-bold text-purple bg-purple-soft px-1.5 py-0.5 rounded">
                            DEFAULT
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="font-mono text-text-muted text-xs">{palette.slug}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="font-mono text-text-muted text-xs">{palette.order}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(palette)}
                      disabled={saving}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded transition-colors ${
                        palette.isActive
                          ? 'text-green bg-green/10 hover:bg-green/20'
                          : 'text-text-muted bg-bg-elevated hover:bg-bg-card'
                      }`}
                    >
                      {palette.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {!palette.isDefault && (
                        <button
                          onClick={() => handleSetDefault(palette)}
                          disabled={saving}
                          className="text-[10px] font-mono text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
                          title="Set as default"
                        >
                          set default
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(palette)}
                        className="text-[10px] font-mono text-purple hover:opacity-80 transition-opacity"
                      >
                        edit
                      </button>
                      {!palette.isDefault && (
                        <button
                          onClick={() => handleDelete(palette)}
                          disabled={saving}
                          className="text-[10px] font-mono text-red hover:opacity-80 transition-opacity disabled:opacity-50"
                        >
                          delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {palettes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted font-mono text-sm">
                    No palettes yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
