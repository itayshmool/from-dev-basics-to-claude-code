import { useState, useCallback, useEffect } from 'react';
import { levels } from '../../data/levels';
import { LEVELS } from '../../lib/constants';
import type { Lesson, LessonSection } from '../../core/lesson/types';

interface ValidationResult {
  name: string;
  description: string;
  passed: boolean;
  details: string[];
}

function CheckIcon() {
  return (
    <svg
      className="w-5 h-5 text-green-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      className="w-5 h-5 text-red-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 text-text-muted transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}

function isInteractiveSection(section: LessonSection): boolean {
  return section.type !== 'narrative';
}

function getAllLessonIds(): Set<string> {
  const ids = new Set<string>();
  for (const level of levels) {
    for (const lesson of level.lessons) {
      ids.add(lesson.id);
    }
  }
  return ids;
}

function runValidationChecks(): ValidationResult[] {
  const allLessonIds = getAllLessonIds();
  const results: ValidationResult[] = [];

  // 1. Missing nextLesson
  const missingNextLesson: string[] = [];
  for (const level of levels) {
    const lessonCount = level.lessons.length;
    level.lessons.forEach((lesson: Lesson, index: number) => {
      const isLastInLevel = index === lessonCount - 1;
      if (!lesson.nextLesson && !isLastInLevel) {
        missingNextLesson.push(`${lesson.id} (${lesson.title})`);
      }
    });
  }
  results.push({
    name: 'Missing nextLesson',
    description: 'Lessons without nextLesson that are not last in their level',
    passed: missingNextLesson.length === 0,
    details: missingNextLesson,
  });

  // 2. Broken chains
  const brokenChains: string[] = [];
  for (const level of levels) {
    for (const lesson of level.lessons) {
      if (lesson.nextLesson && !allLessonIds.has(lesson.nextLesson)) {
        brokenChains.push(
          `${lesson.id} -> ${lesson.nextLesson} (not found)`
        );
      }
    }
  }
  results.push({
    name: 'Broken chains',
    description: 'nextLesson points to a non-existent lesson ID',
    passed: brokenChains.length === 0,
    details: brokenChains,
  });

  // 3. Empty sections
  const emptySections: string[] = [];
  for (const level of levels) {
    for (const lesson of level.lessons) {
      if (!lesson.sections || lesson.sections.length === 0) {
        emptySections.push(`${lesson.id} (${lesson.title})`);
      }
    }
  }
  results.push({
    name: 'Empty sections',
    description: 'Lessons with 0 sections',
    passed: emptySections.length === 0,
    details: emptySections,
  });

  // 4. No interactive sections
  const noInteractive: string[] = [];
  for (const level of levels) {
    for (const lesson of level.lessons) {
      if (lesson.sections && lesson.sections.length > 0) {
        const hasInteractive = lesson.sections.some(isInteractiveSection);
        if (!hasInteractive) {
          noInteractive.push(`${lesson.id} (${lesson.title})`);
        }
      }
    }
  }
  results.push({
    name: 'No interactive sections',
    description: 'Lessons with only narrative sections (no quiz, fillInBlank, etc.)',
    passed: noInteractive.length === 0,
    details: noInteractive,
  });

  // 5. Level count mismatch
  const countMismatches: string[] = [];
  for (const levelMeta of LEVELS) {
    const actualLevel = levels.find((l) => l.id === levelMeta.id);
    const actualCount = actualLevel ? actualLevel.lessons.length : 0;
    if (actualCount !== levelMeta.lessonCount) {
      countMismatches.push(
        `Level ${levelMeta.id}: LEVELS says ${levelMeta.lessonCount}, actual is ${actualCount}`
      );
    }
  }
  results.push({
    name: 'Level count mismatch',
    description: 'LEVELS[i].lessonCount does not match actual lesson count',
    passed: countMismatches.length === 0,
    details: countMismatches,
  });

  // 6. Duplicate IDs
  const duplicateIds: string[] = [];
  const seenIds = new Map<string, number>();
  for (const level of levels) {
    for (const lesson of level.lessons) {
      const count = seenIds.get(lesson.id) || 0;
      seenIds.set(lesson.id, count + 1);
    }
  }
  for (const [id, count] of seenIds.entries()) {
    if (count > 1) {
      duplicateIds.push(`${id} (appears ${count} times)`);
    }
  }
  results.push({
    name: 'Duplicate IDs',
    description: 'Same lesson ID appears more than once across all levels',
    passed: duplicateIds.length === 0,
    details: duplicateIds,
  });

  return results;
}

export function AdminContentValidator() {
  const [results, setResults] = useState<ValidationResult[]>([]);
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());

  const runChecks = useCallback(() => {
    const validationResults = runValidationChecks();
    setResults(validationResults);
    setExpandedChecks(new Set());
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  function toggleExpanded(checkName: string): void {
    setExpandedChecks((prev) => {
      const next = new Set(prev);
      if (next.has(checkName)) {
        next.delete(checkName);
      } else {
        next.add(checkName);
      }
      return next;
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary font-mono">
          Content Validator
        </h1>
        <button
          onClick={runChecks}
          className="px-4 py-2 bg-purple text-white rounded-lg font-mono text-sm hover:opacity-90 transition-opacity"
        >
          Run Checks
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-bg-card rounded-xl border border-border p-4 mb-6">
          <p className="text-sm font-mono text-text-primary">
            <span
              className={
                passedCount === totalCount ? 'text-green-500' : 'text-amber-500'
              }
            >
              {passedCount}/{totalCount}
            </span>{' '}
            checks passed
          </p>
        </div>
      )}

      <div className="space-y-3">
        {results.map((result) => {
          const isExpanded = expandedChecks.has(result.name);
          const hasDetails = !result.passed && result.details.length > 0;

          return (
            <div
              key={result.name}
              className="bg-bg-card rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => hasDetails && toggleExpanded(result.name)}
                disabled={!hasDetails}
                className={`w-full flex items-center gap-3 p-4 text-left ${
                  hasDetails ? 'cursor-pointer hover:bg-bg-elevated' : 'cursor-default'
                } transition-colors`}
              >
                {result.passed ? <CheckIcon /> : <XIcon />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono font-semibold text-text-primary">
                    {result.name}
                  </p>
                  <p className="text-xs font-mono text-text-muted truncate">
                    {result.description}
                  </p>
                </div>
                {hasDetails && <ChevronIcon expanded={isExpanded} />}
              </button>

              {isExpanded && hasDetails && (
                <div className="border-t border-border px-4 py-3 bg-bg-elevated">
                  <ul className="space-y-1">
                    {result.details.map((detail, idx) => (
                      <li
                        key={idx}
                        className="text-xs font-mono text-text-muted pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-red-500"
                      >
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
