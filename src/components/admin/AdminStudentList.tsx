import { useEffect, useState, useCallback, useMemo } from 'react';
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

type SortKey = 'createdAt-desc' | 'createdAt-asc' | 'lessonsCompleted-desc' | 'lessonsCompleted-asc' | 'username-asc';
type RoleFilter = 'all' | 'student' | 'admin';
type ProgressFilter = 'all' | 'none' | 'in-progress' | 'completed';

export function AdminStudentList() {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('createdAt-desc');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [progressFilter, setProgressFilter] = useState<ProgressFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<Student[] | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await apiFetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to load');
      setStudents(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  }, []);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (search) {
        const q = search.toLowerCase();
        if (!s.username.toLowerCase().includes(q) && !s.displayName.toLowerCase().includes(q)) return false;
      }
      if (roleFilter !== 'all' && s.role !== roleFilter) return false;
      if (progressFilter === 'none' && s.lessonsCompleted !== 0) return false;
      if (progressFilter === 'completed' && s.lessonsCompleted < totalLessons) return false;
      if (progressFilter === 'in-progress' && (s.lessonsCompleted === 0 || s.lessonsCompleted >= totalLessons)) return false;
      return true;
    });
  }, [students, search, roleFilter, progressFilter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'createdAt-desc': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'createdAt-asc': return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'lessonsCompleted-desc': return b.lessonsCompleted - a.lessonsCompleted;
        case 'lessonsCompleted-asc': return a.lessonsCompleted - b.lessonsCompleted;
        case 'username-asc': return a.username.localeCompare(b.username);
        default: return 0;
      }
    });
  }, [filtered, sortBy]);

  // Selection helpers
  const selectableStudents = sorted.filter(s => s.role === 'student');
  const allSelectableSelected = selectableStudents.length > 0 && selectableStudents.every(s => selected.has(s.id));

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelectableSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableStudents.map(s => s.id)));
    }
  }

  // Delete handlers
  function requestDeleteSingle(student: Student) {
    setDeleteTarget([student]);
  }

  function requestDeleteBulk() {
    const targets = students.filter(s => selected.has(s.id));
    if (targets.length > 0) setDeleteTarget(targets);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.length === 1) {
        const res = await apiFetch(`/api/admin/users/${deleteTarget[0].id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
      } else {
        const res = await apiFetch('/api/admin/users/bulk-delete', {
          method: 'POST',
          body: JSON.stringify({ ids: deleteTarget.map(s => s.id) }),
        });
        if (!res.ok) throw new Error('Bulk delete failed');
      }
      setSelected(new Set());
      setDeleteTarget(null);
      await fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  }

  if (error) return <p className="text-red-400 text-sm">{error}</p>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="text-xl font-semibold text-text-primary font-mono">Students</h1>
        <span className="text-xs text-text-muted font-mono">
          {filtered.length === students.length
            ? `${students.length} total`
            : `${filtered.length} of ${students.length}`}
        </span>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary w-40"
        />
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value as RoleFilter)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="all">All roles</option>
          <option value="student">Students</option>
          <option value="admin">Admins</option>
        </select>
        <select
          value={progressFilter}
          onChange={e => setProgressFilter(e.target.value as ProgressFilter)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="all">All progress</option>
          <option value="none">No progress</option>
          <option value="in-progress">In progress</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortKey)}
          className="text-xs bg-bg-elevated border border-border rounded-lg px-3 py-1.5 text-text-primary"
        >
          <option value="createdAt-desc">Newest</option>
          <option value="createdAt-asc">Oldest</option>
          <option value="lessonsCompleted-desc">Most progress</option>
          <option value="lessonsCompleted-asc">Least progress</option>
          <option value="username-asc">A-Z</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-lg bg-purple-soft border border-purple/20">
          <span className="text-xs font-mono font-semibold text-purple">{selected.size} selected</span>
          <button
            onClick={requestDeleteBulk}
            className="text-xs font-mono font-medium px-3 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      {students.length === 0 ? (
        <p className="text-text-muted text-sm font-mono">Loading...</p>
      ) : sorted.length === 0 ? (
        <p className="text-text-muted text-sm font-mono">No students match filters</p>
      ) : (
        <div className="bg-bg-card rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelectableSelected}
                    onChange={toggleSelectAll}
                    className="rounded accent-[var(--color-purple)]"
                    aria-label="Select all"
                  />
                </th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Username</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Display Name</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="text-right px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider">Completed</th>
                <th className="px-4 py-3 text-[10px] font-mono text-text-muted uppercase tracking-wider w-24"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(s => (
                <tr
                  key={s.id}
                  onClick={() => navigate(`/admin/students/${s.id}`)}
                  className={`border-b border-border/50 last:border-0 hover:bg-bg-elevated/30 cursor-pointer ${selected.has(s.id) ? 'bg-purple-soft/30' : ''}`}
                >
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    {s.role === 'student' && (
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        className="rounded accent-[var(--color-purple)]"
                        aria-label={`Select ${s.username}`}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-text-primary">
                    {s.username}
                    {s.role === 'admin' && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-purple-soft text-purple font-semibold">admin</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{s.displayName}</td>
                  <td className="px-4 py-3 text-text-muted hidden md:table-cell">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    <span className="text-purple font-semibold">{s.lessonsCompleted}</span>
                    <span className="text-text-muted">/{totalLessons}</span>
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {s.role === 'student' && (
                        <>
                          <div className="relative inline-block group">
                            <button
                              onClick={async () => {
                                await startImpersonation(s.id);
                                navigate('/');
                              }}
                              className="text-[10px] font-mono px-2 py-1 rounded bg-amber-600/20 text-amber-500 hover:bg-amber-600/30 transition-colors"
                            >
                              Impersonate
                            </button>
                            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                              {`View as ${s.username}`}
                            </span>
                          </div>
                          <div className="relative inline-block group">
                            <button
                              onClick={() => requestDeleteSingle(s)}
                              className="w-7 h-7 flex items-center justify-center rounded text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              aria-label={`Delete ${s.username}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                            <span className="pointer-events-none absolute top-full right-0 mt-1.5 px-2 py-1 rounded-md bg-bg-card border border-border text-[10px] font-mono text-text-primary whitespace-nowrap opacity-0 translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                              Delete
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => !isDeleting && setDeleteTarget(null)}>
          <div className="bg-bg-card border border-border rounded-xl p-6 max-w-md w-full mx-4 shadow-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-text-primary font-mono mb-2">
              Delete {deleteTarget.length === 1 ? 'student' : `${deleteTarget.length} students`}?
            </h2>
            <p className="text-sm text-text-muted mb-4">
              This will permanently delete {deleteTarget.length === 1 ? 'this student' : 'these students'} and all their progress. This cannot be undone.
            </p>
            <div className="mb-4 max-h-32 overflow-y-auto">
              {deleteTarget.slice(0, 10).map(s => (
                <p key={s.id} className="text-xs font-mono text-text-secondary py-0.5">{s.username} ({s.displayName})</p>
              ))}
              {deleteTarget.length > 10 && (
                <p className="text-xs text-text-muted mt-1">+{deleteTarget.length - 10} more</p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-lg bg-bg-elevated text-text-primary hover:bg-bg-card transition-colors border border-border disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors font-medium disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
