import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type { LessonSection } from '../../core/lesson/types';
import { getLessonById } from '../../data/levels';

interface SectionCardProps {
  index: number;
  section: LessonSection;
}

function getSectionBadgeClasses(type: string): string {
  switch (type) {
    case 'narrative':
      return 'text-blue bg-blue-soft';
    case 'quiz':
      return 'text-green bg-green-soft';
    case 'fillInBlank':
      return 'text-yellow bg-yellow-soft';
    case 'terminalStep':
      return 'text-purple bg-purple-soft';
    default:
      return 'text-text-muted bg-bg-elevated';
  }
}

function getSectionPreview(section: LessonSection): string {
  switch (section.type) {
    case 'narrative':
      return section.content.length > 100
        ? section.content.slice(0, 100) + '...'
        : section.content;
    case 'quiz':
      return section.question;
    case 'fillInBlank':
      return section.prompt;
    case 'terminalStep':
      return `Prompt: "${section.prompt}" | Expected: ${JSON.stringify(section.validation)}`;
    default:
      return 'Preview not available';
  }
}

function SectionCard({ index, section }: SectionCardProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-bg-card rounded-xl border border-border p-4">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-1 rounded">
            #{index}
          </span>
          <span
            className={`text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded ${getSectionBadgeClasses(section.type)}`}
          >
            {section.type}
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-mono text-text-muted hover:text-text-primary transition-colors"
        >
          {isExpanded ? 'Hide JSON' : 'Show JSON'}
        </button>
      </div>

      <p className="text-sm text-text-primary leading-relaxed">
        {getSectionPreview(section)}
      </p>

      {isExpanded && (
        <pre className="mt-4 p-3 bg-bg-elevated rounded-lg text-xs font-mono text-text-muted overflow-x-auto max-h-64 overflow-y-auto">
          {JSON.stringify(section, null, 2)}
        </pre>
      )}
    </div>
  );
}

export function AdminLessonPreview(): React.ReactElement {
  const { lessonId } = useParams<{ lessonId: string }>();
  const lesson = lessonId ? getLessonById(lessonId) : null;

  if (!lesson) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-semibold text-text-primary mb-4">
          Lesson Not Found
        </h1>
        <p className="text-text-muted mb-6">
          No lesson exists with ID: <code className="font-mono">{lessonId}</code>
        </p>
        <Link
          to="/admin/lessons"
          className="text-purple font-mono text-sm hover:underline"
        >
          Back to Lessons
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/admin/lessons"
          className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Lessons
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <code className="text-xs font-mono text-text-muted bg-bg-elevated px-2 py-1 rounded">
                {lesson.id}
              </code>
              <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded text-purple bg-purple-soft">
                {lesson.type}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-text-primary mb-1">
              {lesson.title}
            </h1>
            <p className="text-text-muted">{lesson.subtitle}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-mono text-text-muted">
              {lesson.sections.length} sections
            </p>
          </div>
        </div>
      </div>

      {/* Section List */}
      <div className="mb-8">
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
          Sections
        </h2>
        <div className="space-y-4">
          {lesson.sections.map((section, idx) => (
            <SectionCard key={idx} index={idx + 1} section={section} />
          ))}
        </div>
      </div>

      {/* Metadata Panel */}
      <div className="bg-bg-card rounded-xl border border-border p-4">
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider mb-4">
          Metadata
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">Type</p>
            <p className="text-text-primary">{lesson.type}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">Total Sections</p>
            <p className="text-text-primary font-mono">{lesson.sections.length}</p>
          </div>
          <div>
            <p className="text-xs font-mono text-text-muted mb-1">Next Lesson</p>
            <p className="text-text-primary font-mono">
              {lesson.nextLesson ?? 'None'}
            </p>
          </div>
          {lesson.level !== undefined && (
            <div>
              <p className="text-xs font-mono text-text-muted mb-1">Level</p>
              <p className="text-text-primary font-mono">{lesson.level}</p>
            </div>
          )}
          {lesson.order !== undefined && (
            <div>
              <p className="text-xs font-mono text-text-muted mb-1">Order</p>
              <p className="text-text-primary font-mono">{lesson.order}</p>
            </div>
          )}
          {lesson.commandsIntroduced && lesson.commandsIntroduced.length > 0 && (
            <div className="col-span-2 md:col-span-3">
              <p className="text-xs font-mono text-text-muted mb-1">
                Commands Introduced
              </p>
              <div className="flex flex-wrap gap-2">
                {lesson.commandsIntroduced.map((cmd) => (
                  <code
                    key={cmd}
                    className="text-xs font-mono bg-bg-elevated px-2 py-1 rounded text-text-primary"
                  >
                    {cmd}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
