// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StepThrough } from './StepThrough';
import type { StepThroughSection } from '../../core/lesson/types';

const mockSection: StepThroughSection = {
  type: 'stepThrough',
  instruction: 'Learn the basics',
  steps: [
    { title: 'Step One', description: 'First step desc', highlight: 'cmd1' },
    { title: 'Step Two', description: 'Second step desc' },
    { title: 'Step Three', description: 'Third step desc' },
  ],
};

describe('StepThrough', () => {
  it('renders instruction and first step', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('Learn the basics')).toBeTruthy();
    expect(screen.getByText('Step One')).toBeTruthy();
    expect(screen.getByText('First step desc')).toBeTruthy();
  });

  it('has region role with aria-labelledby', () => {
    const { container } = render(<StepThrough section={mockSection} onComplete={() => {}} />);
    const region = container.querySelector('[role="region"]');
    expect(region).toBeTruthy();
    expect(region!.getAttribute('aria-labelledby')).toBe('stepthrough-instruction');
  });

  it('shows step counter with aria-live', () => {
    const { container } = render(<StepThrough section={mockSection} onComplete={() => {}} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
    expect(liveRegion!.textContent).toContain('Step 1 of 3');
  });

  it('navigates with Next button', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step Two')).toBeTruthy();
  });

  it('navigates with Previous button', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Previous'));
    expect(screen.getByText('Step One')).toBeTruthy();
  });

  it('navigates with ArrowRight key', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Step Two')).toBeTruthy();
  });

  it('navigates with ArrowLeft key', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('Step One')).toBeTruthy();
  });

  it('has aria-label on progress dots', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    const dot = screen.getByLabelText('Go to step 1 (current)');
    expect(dot).toBeTruthy();
  });

  it('shows completion when all steps visited', () => {
    render(<StepThrough section={mockSection} onComplete={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText(/All steps reviewed/)).toBeTruthy();
  });

  it('calls onComplete via Continue button', () => {
    const onComplete = vi.fn();
    render(<StepThrough section={mockSection} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
