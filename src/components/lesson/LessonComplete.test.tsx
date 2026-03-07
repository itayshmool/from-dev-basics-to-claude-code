// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LessonComplete } from './LessonComplete';

describe('LessonComplete', () => {
  it('renders completion message', () => {
    render(<LessonComplete message="Great work!" onNext={() => {}} onHome={() => {}} hasNext />);
    expect(screen.getByText('Lesson Complete!')).toBeTruthy();
    expect(screen.getByText('Great work!')).toBeTruthy();
  });

  it('shows Next Lesson button when hasNext is true', () => {
    render(<LessonComplete message="Done" onNext={() => {}} onHome={() => {}} hasNext />);
    expect(screen.getByText('Next Lesson')).toBeTruthy();
  });

  it('hides Next Lesson button when hasNext is false', () => {
    render(<LessonComplete message="Done" onNext={() => {}} onHome={() => {}} hasNext={false} />);
    expect(screen.queryByText('Next Lesson')).toBeNull();
  });

  it('calls onNext when Next Lesson is clicked', () => {
    const onNext = vi.fn();
    render(<LessonComplete message="Done" onNext={onNext} onHome={() => {}} hasNext />);
    fireEvent.click(screen.getByText('Next Lesson'));
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('calls onHome when Back to Home is clicked', () => {
    const onHome = vi.fn();
    render(<LessonComplete message="Done" onNext={() => {}} onHome={onHome} hasNext />);
    fireEvent.click(screen.getByText('Back to Home'));
    expect(onHome).toHaveBeenCalledOnce();
  });

  it('renders confetti particles', () => {
    const { container } = render(
      <LessonComplete message="Done" onNext={() => {}} onHome={() => {}} hasNext />
    );
    // Confetti container has aria-hidden
    const confettiContainer = container.querySelector('[aria-hidden="true"]');
    expect(confettiContainer).toBeTruthy();
    // Should have 24 confetti particles
    expect(confettiContainer!.children.length).toBe(24);
  });

  it('has party popper emoji', () => {
    render(<LessonComplete message="Done" onNext={() => {}} onHome={() => {}} hasNext />);
    // Party popper is &#127881; which is 🎉
    expect(screen.getByText('🎉')).toBeTruthy();
  });
});
