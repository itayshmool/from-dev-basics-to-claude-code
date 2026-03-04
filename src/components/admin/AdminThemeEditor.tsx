import { useState } from 'react';

interface ModeSettings {
  textMuted: string;
  mobileFontSize: number;
  desktopFontSize: number;
}

interface ThemeSettings {
  dark: ModeSettings;
  light: ModeSettings;
}

const DEFAULT_SETTINGS: ThemeSettings = {
  dark: {
    textMuted: '#78788A',
    mobileFontSize: 11,
    desktopFontSize: 13,
  },
  light: {
    textMuted: '#737380',
    mobileFontSize: 11,
    desktopFontSize: 13,
  },
};

const DARK_BG = '#09090B';
const DARK_TEXT_PRIMARY = '#EAEAEC';
const LIGHT_BG = '#FAFAF8';
const LIGHT_TEXT_PRIMARY = '#1A1A1B';
const ACCENT_COLOR = '#FF6B35';

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = Math.max(luminance(fg), luminance(bg));
  const L2 = Math.min(luminance(fg), luminance(bg));
  return (L1 + 0.05) / (L2 + 0.05);
}

function getContrastBadge(ratio: number): { label: string; color: string; bgColor: string } {
  if (ratio >= 4.5) {
    return { label: 'AAA', color: '#22C55E', bgColor: 'rgba(34, 197, 94, 0.15)' };
  }
  if (ratio >= 3) {
    return { label: 'AA', color: '#EAB308', bgColor: 'rgba(234, 179, 8, 0.15)' };
  }
  return { label: 'Fail', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.15)' };
}

function generateCSS(settings: ThemeSettings): string {
  return `/* Dark mode text-muted override */
@theme {
  --color-text-muted: ${settings.dark.textMuted};
}

/* Light mode text-muted override */
[data-theme="light"] {
  --color-text-muted: ${settings.light.textMuted};
}

/* Font size utilities (if needed) */
.text-muted-mobile { font-size: ${settings.dark.mobileFontSize}px; }
.text-muted-desktop { font-size: ${settings.dark.desktopFontSize}px; }
`;
}

interface PreviewCardProps {
  mode: 'dark' | 'light';
  label: string;
  bgColor: string;
  textPrimary: string;
  textMuted: string;
  fontSize: number;
}

function PreviewCard({ mode, label, bgColor, textPrimary, textMuted, fontSize }: PreviewCardProps) {
  const cardBg = mode === 'dark' ? '#141419' : '#FFFFFF';
  const borderColor = mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const progressBg = mode === 'dark' ? '#1C1C24' : '#EDECEA';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        borderRadius: 12,
        padding: 16,
        flex: 1,
        minWidth: 200,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontFamily: 'Monaco, monospace',
          color: textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: 12,
        }}
      >
        {label}
      </p>

      {/* Simulated Level Card */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${borderColor}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        {/* Level Header */}
        <div style={{ marginBottom: 12 }}>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: textPrimary,
              fontFamily: 'Monaco, monospace',
              marginBottom: 4,
            }}
          >
            Level 0: Computers Are Not Magic
          </p>
          <p
            style={{
              fontSize: fontSize,
              color: textMuted,
              fontFamily: '-apple-system, sans-serif',
            }}
          >
            Understanding the basics before the terminal
          </p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              height: 4,
              backgroundColor: progressBg,
              borderRadius: 999,
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: '66%',
                height: '100%',
                backgroundColor: ACCENT_COLOR,
                borderRadius: 999,
              }}
            />
          </div>
          <p
            style={{
              fontSize: fontSize,
              color: textMuted,
              fontFamily: 'Monaco, monospace',
            }}
          >
            4/6 lessons
          </p>
        </div>

        {/* Lesson Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { title: '1. What is a Computer?', sub: 'The basics of computing' },
            { title: '2. Files and Folders', sub: 'Organizing your data' },
            { title: '3. Programs', sub: 'How software works' },
          ].map((lesson, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${borderColor}`,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: textPrimary,
                    fontFamily: '-apple-system, sans-serif',
                    marginBottom: 2,
                  }}
                >
                  {lesson.title}
                </p>
                <p
                  style={{
                    fontSize: fontSize,
                    color: textMuted,
                    fontFamily: '-apple-system, sans-serif',
                  }}
                >
                  {lesson.sub}
                </p>
              </div>
              {i < 2 && (
                <span style={{ color: '#22C55E', fontSize: 14 }}>
                  ✓
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Coming Soon Label */}
        <div
          style={{
            marginTop: 12,
            padding: '6px 10px',
            backgroundColor: progressBg,
            borderRadius: 6,
            display: 'inline-block',
          }}
        >
          <p
            style={{
              fontSize: fontSize,
              color: textMuted,
              fontFamily: 'Monaco, monospace',
            }}
          >
            Coming soon
          </p>
        </div>
      </div>
    </div>
  );
}

interface ModeEditorProps {
  mode: 'dark' | 'light';
  settings: ModeSettings;
  onChange: (settings: ModeSettings) => void;
  bgColor: string;
  textPrimary: string;
}

function ModeEditor({ mode, settings, onChange, bgColor, textPrimary }: ModeEditorProps) {
  const contrast = contrastRatio(settings.textMuted, bgColor);
  const badge = getContrastBadge(contrast);

  return (
    <div className="bg-bg-card rounded-xl border border-border p-6">
      <h2 className="text-sm font-semibold text-text-primary font-mono mb-6 capitalize">
        {mode} Mode
      </h2>

      {/* Color Picker Section */}
      <div className="mb-6">
        <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
          text-muted color
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.textMuted}
            onChange={(e) => onChange({ ...settings, textMuted: e.target.value })}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={settings.textMuted.toUpperCase()}
            onChange={(e) => {
              const val = e.target.value;
              if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                onChange({ ...settings, textMuted: val });
              }
            }}
            className="flex-1 bg-bg-elevated border border-border rounded-lg px-3 py-2 font-mono text-sm text-text-primary"
            placeholder="#000000"
          />
          <div
            style={{
              backgroundColor: badge.bgColor,
              color: badge.color,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              fontFamily: 'Monaco, monospace',
            }}
          >
            {contrast.toFixed(2)}:1 {badge.label}
          </div>
        </div>
      </div>

      {/* Font Size Sliders */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
            Mobile Font Size: {settings.mobileFontSize}px
          </label>
          <input
            type="range"
            min={9}
            max={18}
            value={settings.mobileFontSize}
            onChange={(e) =>
              onChange({ ...settings, mobileFontSize: parseInt(e.target.value, 10) })
            }
            className="w-full accent-purple"
          />
        </div>
        <div>
          <label className="block text-[10px] font-mono text-text-muted uppercase tracking-wider mb-2">
            Desktop Font Size: {settings.desktopFontSize}px
          </label>
          <input
            type="range"
            min={9}
            max={18}
            value={settings.desktopFontSize}
            onChange={(e) =>
              onChange({ ...settings, desktopFontSize: parseInt(e.target.value, 10) })
            }
            className="w-full accent-purple"
          />
        </div>
      </div>

      {/* Preview Cards */}
      <div className="flex gap-4">
        <PreviewCard
          mode={mode}
          label="Mobile Preview"
          bgColor={bgColor}
          textPrimary={textPrimary}
          textMuted={settings.textMuted}
          fontSize={settings.mobileFontSize}
        />
        <PreviewCard
          mode={mode}
          label="Desktop Preview"
          bgColor={bgColor}
          textPrimary={textPrimary}
          textMuted={settings.textMuted}
          fontSize={settings.desktopFontSize}
        />
      </div>
    </div>
  );
}

export function AdminThemeEditor() {
  const [settings, setSettings] = useState<ThemeSettings>(DEFAULT_SETTINGS);
  const [copied, setCopied] = useState(false);

  function handleCopyCSS(): void {
    const css = generateCSS(settings);
    navigator.clipboard.writeText(css).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleReset(): void {
    setSettings(DEFAULT_SETTINGS);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Theme Editor</h1>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm font-mono text-text-muted bg-bg-elevated border border-border rounded-lg hover:bg-bg-card transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleCopyCSS}
            className="px-4 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity"
          >
            {copied ? 'Copied!' : 'Copy CSS'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <ModeEditor
          mode="dark"
          settings={settings.dark}
          onChange={(dark) => setSettings({ ...settings, dark })}
          bgColor={DARK_BG}
          textPrimary={DARK_TEXT_PRIMARY}
        />

        <ModeEditor
          mode="light"
          settings={settings.light}
          onChange={(light) => setSettings({ ...settings, light })}
          bgColor={LIGHT_BG}
          textPrimary={LIGHT_TEXT_PRIMARY}
        />
      </div>

      {/* CSS Preview */}
      <div className="mt-6 bg-bg-card rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-text-primary font-mono mb-4">
          Generated CSS
        </h2>
        <pre className="bg-bg-elevated rounded-lg p-4 overflow-x-auto text-xs font-mono text-text-secondary">
          {generateCSS(settings)}
        </pre>
      </div>
    </div>
  );
}
