import { useState, useRef } from 'react';
import { apiFetch } from '../../services/api';
import { useTurnstile } from '../../hooks/useTurnstile';

export interface BugReportContext {
  lessonId: string;
  lessonTitle: string;
  sectionIndex: number;
  totalSections: number;
  instruction?: string;
  validation?: unknown;
  terminalHistory?: { type: 'input' | 'output' | 'error'; text: string }[];
  lastCommand?: string;
  vfsState?: unknown;
  cwd?: string;
}

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: BugReportContext;
}

const COOLDOWN_KEY_PREFIX = 'bugReport_cooldown_';
const COOLDOWN_MS = 5 * 60 * 1000;

function getCooldownKey(lessonId: string) {
  return `${COOLDOWN_KEY_PREFIX}${lessonId}`;
}

function isOnCooldown(lessonId: string): boolean {
  const ts = sessionStorage.getItem(getCooldownKey(lessonId));
  if (!ts) return false;
  return Date.now() - parseInt(ts, 10) < COOLDOWN_MS;
}

function setCooldown(lessonId: string) {
  sessionStorage.setItem(getCooldownKey(lessonId), String(Date.now()));
}

export function BugReportModal({ isOpen, onClose, context }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ issueNumber: number; issueUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileRef = useRef<HTMLDivElement>(null);

  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

  const { isLoading: turnstileLoading, isError: turnstileError, reset: resetTurnstile } = useTurnstile(
    turnstileRef,
    {
      siteKey: siteKey || '',
      onVerify: (token) => setTurnstileToken(token),
      onError: () => setTurnstileToken(null),
      onExpire: () => setTurnstileToken(null),
    },
  );

  if (!isOpen) return null;

  const onCooldown = isOnCooldown(context.lessonId);

  async function handleSubmit() {
    if (!description.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiFetch('/api/bug-reports', {
        method: 'POST',
        body: JSON.stringify({
          ...context,
          description: description.trim(),
          expectedBehavior: expectedBehavior.trim() || undefined,
          browser: navigator.userAgent,
          screenSize: `${window.innerWidth}x${window.innerHeight}`,
          themeMode: document.documentElement.getAttribute('data-theme') || 'dark',
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || `Failed (${res.status})`);
      }

      const data = await res.json();
      setResult(data);
      setCooldown(context.lessonId);
      setTurnstileToken(null);
      resetTurnstile();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report.');
      setTurnstileToken(null);
      resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setDescription('');
    setExpectedBehavior('');
    setShowDetails(false);
    setResult(null);
    setError(null);
    setTurnstileToken(null);
    onClose();
  }

  // Format terminal history for display
  const historyPreview = context.terminalHistory
    ?.slice(-10)
    .map((l) => l.text)
    .join('\n');

  return (
    <div className="bug-report-overlay fixed inset-0 z-50 flex items-start justify-center pt-16 px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-bg-overlay" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-bg-card border border-border rounded-xl shadow-float w-full max-w-lg max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text-primary font-mono">Report an Issue</h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-md text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Lesson context */}
          <p className="text-xs font-mono text-text-muted">
            Lesson {context.lessonId} — {context.lessonTitle} (Section {context.sectionIndex + 1}/{context.totalSections})
          </p>

          {/* Success state */}
          {result && (
            <div className="bg-green-soft border border-green/20 rounded-lg px-4 py-3">
              <p className="text-sm font-mono text-green font-semibold mb-1">Report submitted!</p>
              <p className="text-xs text-text-secondary">
                Issue #{result.issueNumber} has been created. Thank you for helping us improve.
              </p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="bg-red-soft border border-red/20 rounded-lg px-4 py-3">
              <p className="text-xs font-mono text-red">{error}</p>
            </div>
          )}

          {!result && (
            <>
              {/* Cooldown notice */}
              {onCooldown && (
                <div className="bg-yellow-soft border border-yellow/20 rounded-lg px-4 py-3">
                  <p className="text-xs font-mono text-yellow">
                    You recently submitted a report for this lesson. Please wait a few minutes before submitting another.
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5 block">
                  What went wrong? *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue you encountered..."
                  rows={3}
                  maxLength={2000}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-purple focus:outline-none resize-none"
                />
              </div>

              {/* Expected behavior */}
              <div>
                <label className="text-[10px] font-mono text-text-muted uppercase tracking-wider mb-1.5 block">
                  What did you expect to happen? (optional)
                </label>
                <textarea
                  value={expectedBehavior}
                  onChange={(e) => setExpectedBehavior(e.target.value)}
                  placeholder="I expected..."
                  rows={2}
                  maxLength={2000}
                  className="w-full bg-bg-elevated border border-border rounded-lg px-3 py-2 font-sans text-sm text-text-primary placeholder:text-text-muted/50 focus:border-purple focus:outline-none resize-none"
                />
              </div>

              {/* Turnstile CAPTCHA */}
              {siteKey && (
                <div>
                  <div ref={turnstileRef} />
                  {turnstileLoading && (
                    <p className="text-[10px] font-mono text-text-muted mt-1">Loading verification...</p>
                  )}
                  {turnstileError && (
                    <p className="text-[10px] font-mono text-red mt-1">Verification failed to load. You can still submit.</p>
                  )}
                </div>
              )}

              {/* Collapsible details */}
              <div>
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1.5 text-[10px] font-mono text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors"
                >
                  <span className="text-[9px]">{showDetails ? '\u25BC' : '\u25B6'}</span>
                  Details being sent
                </button>
                {showDetails && (
                  <div className="mt-2 bg-bg-elevated rounded-lg p-3 text-[11px] font-mono text-text-muted space-y-2 max-h-48 overflow-y-auto">
                    {context.instruction && (
                      <div>
                        <span className="text-text-secondary">Instruction:</span>{' '}
                        {context.instruction.slice(0, 200)}
                      </div>
                    )}
                    {context.cwd && (
                      <div>
                        <span className="text-text-secondary">Directory:</span> {context.cwd}
                      </div>
                    )}
                    {context.lastCommand && (
                      <div>
                        <span className="text-text-secondary">Last command:</span> {context.lastCommand}
                      </div>
                    )}
                    {historyPreview && (
                      <div>
                        <span className="text-text-secondary">Recent commands:</span>
                        <pre className="mt-1 text-[10px] whitespace-pre-wrap opacity-70">
                          {historyPreview}
                        </pre>
                      </div>
                    )}
                    <div>
                      <span className="text-text-secondary">Browser, screen size, and filesystem state will also be included.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={!description.trim() || submitting || onCooldown || (!!siteKey && !turnstileToken && !turnstileError)}
                  className="px-4 py-2 text-sm font-mono text-white bg-purple rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </>
          )}

          {/* Close after success */}
          {result && (
            <div className="flex justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-mono text-text-muted bg-bg-elevated border border-border rounded-lg hover:bg-bg-card transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
