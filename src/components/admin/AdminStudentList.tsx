import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { LEVELS } from '../../lib/constants';

interface Student {
  id: string;
  username: string;
  displayName: string;
  role: string;
  createdAt: string;
  lessonsCompleted: number;
}

const totalLessons = LEVELS.reduce((sum, l) => sum + l.lessonCount, 0);

export function AdminStudentList() {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
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

  const filtered = students.filter(s =>
    !search || s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.displayName.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'lessonsCompleted') return b.lessonsCompleted - a.lessonsCompleted;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  if (error) return <p className="text-red text-sm">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Students</h1>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary w-40"
          />
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="createdAt">Newest</option>
          <option value="lessonsCompleted">Most progress</option>
        </select>
        </div>
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
                <th className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-10"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr key={s.id} onClick={() => navigate(`/admin/students/${s.id}`)} className="border-b border-border/50 last:border-0 hover:bg-bg-elevated/30 cursor-pointer">
                  <td className="px-4 py-3 font-mono text-text-primary">{s.username}</td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{s.displayName}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="text-purple font-semibold">{s.lessonsCompleted}</span>
                    <span className="text-text-muted">/{totalLessons}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {s.role === 'student' && (
                      <div className="relative inline-block group">
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await startImpersonation(s.id);
                            navigate('/');
                          }}
                          className="text-[10px] font-mono px-2 py-1 rounded bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 transition-colors"
                          title={`View as ${s.username}`}
                        >
                          Impersonate
                        </button>
                        <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                          {`View as ${s.username}`}
                        </span>
                      </div>
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
