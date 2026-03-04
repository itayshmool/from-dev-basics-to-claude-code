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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', subtitle: '', emoji: '' });

  useEffect(() => {
    apiFetch('/api/admin/levels')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setLevels)
      .catch(err => setError(err.message));
  }, []);

  function startEdit(level: Level) {
    setEditingId(level.id);
    setEditForm({ title: level.title, subtitle: level.subtitle, emoji: level.emoji });
  }

  async function saveEdit(level: Level) {
    const res = await apiFetch(`/api/admin/levels/${level.id}`, {
      method: 'PUT',
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setLevels(prev => prev.map(l =>
        l.id === level.id ? { ...l, ...editForm } : l
      ));
      setEditingId(null);
    }
  }

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
                <th className="text-right px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {levels.map(l => (
                <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30">
                  <td className="px-4 py-3 font-mono text-text-muted">
                    {editingId === l.id ? (
                      <input
                        type="text"
                        value={editForm.emoji}
                        onChange={e => setEditForm({ ...editForm, emoji: e.target.value })}
                        className="w-10 px-1 py-0.5 rounded bg-bg-elevated border border-border text-text-primary text-sm"
                      />
                    ) : (
                      <>{l.emoji} {l.id}</>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-text-primary">
                    {editingId === l.id ? (
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-primary text-sm font-mono"
                      />
                    ) : (
                      l.title
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell truncate max-w-xs">
                    {editingId === l.id ? (
                      <input
                        type="text"
                        value={editForm.subtitle}
                        onChange={e => setEditForm({ ...editForm, subtitle: e.target.value })}
                        className="w-full px-2 py-0.5 rounded bg-bg-elevated border border-border text-text-primary text-xs"
                      />
                    ) : (
                      l.subtitle
                    )}
                  </td>
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
                  <td className="px-4 py-3 text-right">
                    {editingId === l.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => saveEdit(l)}
                          className="text-xs text-green font-mono hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs text-text-muted font-mono hover:underline"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(l)}
                        className="text-xs text-purple font-mono hover:underline"
                      >
                        Edit
                      </button>
                    )}
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
