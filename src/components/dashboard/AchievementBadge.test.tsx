// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementBadge } from './AchievementBadge';

describe('AchievementBadge', () => {
  it('renders earned achievement with glow', () => {
    const { container } = render(
      <AchievementBadge icon="🎓" title="Graduate" description="Complete all lessons" earned earnedAt="2026-01-15T00:00:00Z" />
    );
    expect(screen.getByText('Graduate')).toBeTruthy();
    expect(screen.getByText('Complete all lessons')).toBeTruthy();
    expect(screen.getByText(/Earned/)).toBeTruthy();
    expect(container.querySelector('.shadow-glow')).toBeTruthy();
  });

  it('renders locked achievement with progress bar', () => {
    const { container } = render(
      <AchievementBadge icon="💪" title="Making Progress" description="Complete 25 lessons" earned={false} progress={0.5} />
    );
    expect(screen.getByText('Making Progress')).toBeTruthy();
    expect(screen.getByText('50%')).toBeTruthy();
    // Has progress bar
    const bar = container.querySelector('[style*="width: 50%"]');
    expect(bar).toBeTruthy();
  });

  it('renders locked achievement at 0% with hint', () => {
    render(
      <AchievementBadge icon="🔥" title="Hot Streak" description="3-day streak" earned={false} progress={0} hint="Keep learning!" />
    );
    expect(screen.getByText('Keep learning!')).toBeTruthy();
  });

  it('shows "Not started" when 0% with no hint', () => {
    render(
      <AchievementBadge icon="🔥" title="Hot Streak" description="3-day streak" earned={false} progress={0} />
    );
    expect(screen.getByText('Not started')).toBeTruthy();
  });

  it('has listitem role', () => {
    render(
      <AchievementBadge icon="👶" title="First Step" description="Complete 1 lesson" earned={false} progress={0} />
    );
    expect(screen.getByRole('listitem')).toBeTruthy();
  });

  it('has aria-label with status', () => {
    render(
      <AchievementBadge icon="👶" title="First Step" description="Complete 1 lesson" earned progress={1} />
    );
    const item = screen.getByRole('listitem');
    expect(item.getAttribute('aria-label')).toContain('First Step');
    expect(item.getAttribute('aria-label')).toContain('earned');
  });

  it('applies grayscale to locked icon', () => {
    const { container } = render(
      <AchievementBadge icon="🎓" title="Graduate" description="All lessons" earned={false} progress={0.1} />
    );
    const iconCircle = container.querySelector('.grayscale-\\[0\\.5\\]');
    expect(iconCircle).toBeTruthy();
  });

  it('does not apply grayscale to earned icon', () => {
    const { container } = render(
      <AchievementBadge icon="🎓" title="Graduate" description="All lessons" earned />
    );
    const iconCircle = container.querySelector('.grayscale-\\[0\\.5\\]');
    expect(iconCircle).toBeNull();
  });
});
