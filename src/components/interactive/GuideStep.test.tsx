// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuideStep } from './GuideStep';
import type { GuideStepSection } from '../../core/lesson/types';

const checklistSection: GuideStepSection = {
  type: 'guideStep',
  instruction: 'Follow these steps to set up',
  confirmationType: 'checklist',
  checklistItems: ['Open Terminal', 'Type node -v', 'Verify output'],
};

const continueSection: GuideStepSection = {
  type: 'guideStep',
  instruction: 'Read the explanation below',
  confirmationType: 'continue',
};

const troubleshootSection: GuideStepSection = {
  type: 'guideStep',
  instruction: 'Run the command',
  confirmationType: 'success_or_error',
  troubleshooting: [
    { problem: 'Command not found', solution: 'Install Node.js first' },
  ],
};

describe('GuideStep', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders instruction text', () => {
    render(<GuideStep section={continueSection} onComplete={() => {}} />);
    expect(screen.getByText('Read the explanation below')).toBeTruthy();
  });

  it('renders Continue button for continue type', () => {
    render(<GuideStep section={continueSection} onComplete={() => {}} />);
    expect(screen.getByText('Continue')).toBeTruthy();
  });

  it('calls onComplete on Continue click', () => {
    const onComplete = vi.fn();
    render(<GuideStep section={continueSection} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('renders checklist items with checkbox role', () => {
    render(<GuideStep section={checklistSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);
  });

  it('has group role on checklist container', () => {
    const { container } = render(<GuideStep section={checklistSection} onComplete={() => {}} />);
    const group = container.querySelector('[role="group"]');
    expect(group).toBeTruthy();
    expect(group!.getAttribute('aria-label')).toBe('Verification checklist');
  });

  it('toggles checklist item on click', () => {
    render(<GuideStep section={checklistSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('navigates checklist with ArrowDown', () => {
    render(<GuideStep section={checklistSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[0].focus();
    fireEvent.keyDown(checkboxes[0], { key: 'ArrowDown' });
    expect(checkboxes[1].tabIndex).toBe(0);
  });

  it('toggles checklist with Space key', () => {
    render(<GuideStep section={checklistSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.keyDown(checkboxes[0], { key: ' ' });
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('shows "I got an error" for success_or_error type', () => {
    render(<GuideStep section={troubleshootSection} onComplete={() => {}} />);
    expect(screen.getByText('I got an error')).toBeTruthy();
  });

  it('shows troubleshooting panel on toggle', () => {
    render(<GuideStep section={troubleshootSection} onComplete={() => {}} />);
    fireEvent.click(screen.getByText('I got an error'));
    expect(screen.getByText('Command not found')).toBeTruthy();
  });
});
