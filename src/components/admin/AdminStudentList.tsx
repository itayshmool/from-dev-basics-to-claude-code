import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';

interface Student {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
  lessonsCompleted: number;
}

export function AdminStudentList() {
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'lessonsCompleted'>('createdAt');

  useEffect(() => {
    apiFetch('/api/admin/users')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json();
      })
      .then(setStudents)
      .catch(err => setError(err.message));
  }, []);

  const sorted = [...students].sort((a, b) => {
    if (sortBy === 'lessonsCompleted') return b.lessonsCompleted - a.lessonsCompleted;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (error) return <p className="text-red text-sm">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Students</h1>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="createdAt">Newest</option>
          <option value="lessonsCompleted">Most progress</option>
        </select>
      </div>

      {students.length === 0 ? (
        <p className="text-text-muted text-sm font-mono">Loading...</p>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Display Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Completed</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.id} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30">
                  <td className="px-4 py-3 font-mono text-text-primary">{s.username}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{s.displayName}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="text-purple font-semibold">{s.lessonsCompleted}</span>
                    <span className="text-text-muted">/102</span>
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
