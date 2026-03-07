import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { AchievementToast } from '../components/ui/AchievementToast';
import { apiFetch } from '../services/api';

interface AchievementNotification {
  id: string;
  icon: string;
  title: string;
  description: string;
}

interface AchievementContextValue {
  checkForNewAchievements: (previousEarnedIds: string[]) => Promise<void>;
}

const AchievementCtx = createContext<AchievementContextValue | null>(null);

export function AchievementProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<AchievementNotification[]>([]);

  const checkForNewAchievements = useCallback(async (previousEarnedIds: string[]) => {
    try {
      const res = await apiFetch('/api/progress/achievements');
      if (!res.ok) return;
      const data = await res.json();
      const prevSet = new Set(previousEarnedIds);
      const newOnes: AchievementNotification[] = data.earned
        .filter((a: { id: string }) => !prevSet.has(a.id))
        .map((a: { id: string; icon: string; title: string; description: string }) => ({
          id: a.id,
          icon: a.icon,
          title: a.title,
          description: a.description,
        }));

      if (newOnes.length > 0) {
        setToasts(prev => [...prev, ...newOnes]);
      }
    } catch {
      // Silently fail
    }
  }, []);

  const dismissToast = useCallback(() => {
    setToasts(prev => prev.slice(1));
  }, []);

  return (
    <AchievementCtx.Provider value={{ checkForNewAchievements }}>
      {children}
      {toasts.length > 0 && (
        <AchievementToast
          key={toasts[0].id}
          icon={toasts[0].icon}
          title={toasts[0].title}
          description={toasts[0].description}
          onDismiss={dismissToast}
        />
      )}
    </AchievementCtx.Provider>
  );
}

export function useAchievements(): AchievementContextValue {
  const ctx = useContext(AchievementCtx);
  if (!ctx) throw new Error('useAchievements must be used within AchievementProvider');
  return ctx;
}
