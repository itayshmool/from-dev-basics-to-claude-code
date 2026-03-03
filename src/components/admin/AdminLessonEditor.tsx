import { useEffect, useState, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';

interface LessonData {
  id: string;
  levelId: number;
  title: string;
  subtitle: string;
  type: string;
  order: number;
  sections: unknown[];
  initialFs: unknown;
  initialDir: string | null;
  commandsIntroduced: string[] | null;
  completionMessage: string | null;
  milestone: unknown;
  nextLesson: string | null;
  isPublished: boolean;
}

export function AdminLessonEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [sectionsJson, setSectionsJson] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    apiFetch(`/api/admin/lessons?levelId=`)
      .then(res => res.json())
      .then((all: LessonData[]) => {
        const found = all.find(l => l.id === id);
        if (found) {
          setLesson(found);
          setSectionsJson(JSON.stringify(found.sections, null, 2));
        } else {
          setError('Lesson not found');
        }
      })
      .catch(err => setError(err.message));
  }, [id]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!lesson) return;
    setError('');
    setSaving(true);

    let parsedSections;
    try {
      parsedSections = JSON.parse(sectionsJson);
    } catch {
      setError('Invalid JSON in sections');
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...lesson,
          sections: parsedSections,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Save failed');
      }

      navigate('/admin/lessons');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (error && !lesson) {
    return <p className="text-red text-sm">{error}</p>;
  }

  if (!lesson) {
    return <p className="text-text-muted text-sm font-mono">Loading...</p>;
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold text-text-primary font-mono mb-6">
        Edit Lesson: {lesson.id}
      </h1>

      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="text-sm text-red bg-red-soft px-3 py-2 rounded-lg">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Title</label>
            <input
              type="text"
              value={lesson.title}
              onChange={e => setLesson({ ...lesson, title: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Subtitle</label>
            <input
              type="text"
              value={lesson.subtitle}
              onChange={e => setLesson({ ...lesson, subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Type</label>
            <select
              value={lesson.type}
              onChange={e => setLesson({ ...lesson, type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm"
            >
              <option value="conceptual">Conceptual</option>
              <option value="terminal">Terminal</option>
              <option value="guide">Guide</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Next Lesson</label>
            <input
              type="text"
              value={lesson.nextLesson ?? ''}
              onChange={e => setLesson({ ...lesson, nextLesson: e.target.value || null })}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm font-mono"
              placeholder="e.g., 0.2"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">Order</label>
            <input
              type="number"
              value={lesson.order}
              onChange={e => setLesson({ ...lesson, order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">Completion Message</label>
          <textarea
            value={lesson.completionMessage ?? ''}
            onChange={e => setLesson({ ...lesson, completionMessage: e.target.value || null })}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-sm resize-y"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-text-secondary mb-1">
            Sections (JSON) — {Array.isArray(lesson.sections) ? lesson.sections.length : 0} sections
          </label>
          <textarea
            value={sectionsJson}
            onChange={e => setSectionsJson(e.target.value)}
            rows={20}
            className="w-full px-3 py-2 rounded-lg bg-bg-elevated border border-border text-text-primary text-xs font-mono resize-y"
            spellCheck={false}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-purple text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/lessons')}
            className="px-4 py-2 rounded-lg border border-border text-text-muted text-sm hover:bg-bg-elevated"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
