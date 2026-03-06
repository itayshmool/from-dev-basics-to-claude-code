import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';

/* Cloudflare Turnstile types (minimal subset) */
interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  theme?: 'light' | 'dark' | 'auto';
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

/* Script loading — deduplicated across hook instances */
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error('Failed to load Turnstile script'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/* Hook */
interface UseTurnstileOptions {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export function useTurnstile(
  containerRef: RefObject<HTMLDivElement | null>,
  options: UseTurnstileOptions,
) {
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const widgetIdRef = useRef<string | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!options.siteKey) {
      setIsLoading(false);
      return;
    }

    // Poll until the container DOM element is available (e.g., modal opens)
    const interval = setInterval(() => {
      if (!containerRef.current) return;
      clearInterval(interval);

      // Reset state for fresh render
      setIsError(false);
      setIsLoading(true);

      loadScript()
        .then(() => {
          if (!window.turnstile || !containerRef.current) return;

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: optionsRef.current.siteKey,
            callback: (token: string) => optionsRef.current.onVerify(token),
            'error-callback': () => {
              setIsError(true);
              optionsRef.current.onError?.();
            },
            'expired-callback': () => optionsRef.current.onExpire?.(),
            theme: 'auto',
          });

          setIsLoading(false);
        })
        .catch(() => {
          setIsError(true);
          setIsLoading(false);
        });
    }, 50);

    return () => {
      clearInterval(interval);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [options.siteKey, containerRef]);

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return { isLoading, isError, reset };
}
