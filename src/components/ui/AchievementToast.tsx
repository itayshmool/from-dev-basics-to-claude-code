import { useEffect, useState } from 'react';

interface AchievementToastProps {
  icon: string;
  title: string;
  description?: string;
  onDismiss: () => void;
}

export function AchievementToast({ icon, title, description, onDismiss }: AchievementToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-bg-card/90 backdrop-blur-xl border border-purple/30 rounded-xl px-4 py-3 shadow-glow flex items-center gap-3 max-w-xs">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-[10px] font-mono text-purple uppercase tracking-wider">Achievement Unlocked!</p>
          <p className="text-sm font-mono text-text-primary font-medium">{title}</p>
          {description && (
            <p className="text-[11px] font-mono text-text-muted mt-0.5 leading-snug">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
