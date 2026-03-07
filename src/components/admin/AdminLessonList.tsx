import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { LEVELS } from '../../lib/constants';

interface AdminLesson {
  id: string;
  levelId: number;
  title: string;
  type: string;
  order: number;
  isPublished: boolean;
  sections: unknown[];
}

export function AdminLessonList() {
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const url = filterLevel !== null
      ? `/api/admin/lessons?levelId=${filterLevel}`
      : '/api/admin/lessons';

    apiFetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setLessons)
      .catch(err => setError(err.message));
  }, [filterLevel]);

  async function handleDuplicate(lesson: AdminLesson) {
    const newId = prompt(`Enter new ID for the copy of "${lesson.id}":`, `${lesson.id}-copy`);
    if (!newId) return;
    try {
      const res = await apiFetch(`/api/admin/lessons/${lesson.id}/duplicate`, {
        method: 'POST',
        body: JSON.stringify({ newId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Duplicate failed');
        return;
      }
      const newLesson = await res.json();
      setLessons(prev => [...prev, newLesson]);
    } catch {
      alert('Duplicate failed');
    }
  }

  async function togglePublished(lesson: AdminLesson) {
    const res = await apiFetch(`/api/admin/lessons/${lesson.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isPublished: !lesson.isPublished }),
    });
    if (res.ok) {
      setLessons(prev => prev.map(l =>
        l.id === lesson.id ? { ...l, isPublished: !l.isPublished } : l
      ));
    }
  }

  if (error) return <p className="text-red text-sm">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Lessons</h1>
        <select
          value={filterLevel ?? ''}
          onChange={e => setFilterLevel(e.target.value ? parseInt(e.target.value) : null)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="">All levels</option>
          {LEVELS.map(l => (
            <option key={l.id} value={l.id}>Level {l.displayNumber}</option>
          ))}
        </select>
      </div>

      {lessons.length === 0 ? (
        <p className="text-text-muted text-sm font-mono">Loading...</p>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-16">ID</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Title</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell w-24">Type</th>
                <th className="text-center px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell w-20">Sections</th>
                <th className="text-center px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-24">Published</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-20">Edit</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map(l => (
                <tr key={l.id} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30">
                  <td className="px-4 py-3 font-mono text-text-muted">{l.id}</td>
                  <td className="px-4 py-3 text-text-primary truncate max-w-xs">{l.title}</td>
                  <td className="px-4 py-3 text-text-muted text-xs hidden md:table-cell">{l.type}</td>
                  <td className="px-4 py-3 text-center font-mono text-text-muted hidden md:table-cell">
                    {Array.isArray(l.sections) ? l.sections.length : '?'}
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
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <div className="relative group">
                      <button
                        onClick={() => handleDuplicate(l)}
                        className="text-xs text-text-muted font-mono hover:text-text-primary transition-colors"
                        title="Duplicate lesson"
                      >
                        Copy
                      </button>
                      <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                        Duplicate lesson
                      </span>
                    </div>
                    <Link
                      to={`/admin/lessons/${l.id}`}
                      className="text-xs text-purple font-mono hover:underline"
                    >
                      Edit
                    </Link>
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
