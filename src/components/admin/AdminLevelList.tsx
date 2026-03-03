import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

interface Level {
  id: number;
  title: string;
  subtitle: string;
  emoji: string;
  order: number;
  isPublished: boolean;
}

export function AdminLevelList() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/admin/levels')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setLevels)
      .catch(err => setError(err.message));
  }, []);

  async function togglePublished(level: Level) {
    const res = await apiFetch(`/api/admin/levels/${level.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isPublished: !level.isPublished }),
    });
    if (res.ok) {
      setLevels(prev => prev.map(l =>
        l.id === level.id ? { ...l, isPublished: !l.isPublished } : l
      ));
    }
  }

  if (error) return <p className="text-red text-sm">{error}</p>;

  return (
    <div>
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">Levels</h1>

      {levels.length === 0 ? (
        <p className="text-text-muted text-sm font-mono">Loading...</p>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-12">#</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Subtitle</th>
                <th className="text-center px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-24">Published</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(l => (
                <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30">
                  <td className="px-4 py-3 font-mono text-text-muted">{l.emoji} {l.id}</td>
                  <td className="px-4 py-3 font-mono text-text-primary">{l.title}</td>
                  <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell truncate max-w-xs">{l.subtitle}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublished(l)}
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                        l.isPublished
                          ? 'text-green bg-green-soft'
                          : 'text-text-muted bg-bg-elevated'
                      }`}
                    >
                      {l.isPublished ? 'Yes' : 'No'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
