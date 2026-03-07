// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checklist } from './Checklist';
import type { ChecklistSection } from '../../core/lesson/types';

const mockSection: ChecklistSection = {
  type: 'checklist',
  instruction: 'Verify you have done the following',
  items: [
    { text: 'Install Node.js', hint: 'Use nvm' },
    { text: 'Create project folder' },
    { text: 'Run npm init' },
  ],
};

describe('Checklist', () => {
  it('renders instruction and items', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('Verify you have done the following')).toBeTruthy();
    expect(screen.getByText('Install Node.js')).toBeTruthy();
    expect(screen.getByText('Create project folder')).toBeTruthy();
    expect(screen.getByText('Run npm init')).toBeTruthy();
  });

  it('has group role with aria-labelledby', () => {
    const { container } = render(<Checklist section={mockSection} onComplete={() => {}} />);
    const group = container.querySelector('[role="group"]');
    expect(group).toBeTruthy();
    expect(group!.getAttribute('aria-labelledby')).toBe('checklist-instruction');
  });

  it('has checkbox roles with aria-checked', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3);
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('false');
  });

  it('toggles checkbox on click', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('toggles checkbox with Space key', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.keyDown(checkboxes[0], { key: ' ' });
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('toggles checkbox with Enter key', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.keyDown(checkboxes[0], { key: 'Enter' });
    expect(checkboxes[0].getAttribute('aria-checked')).toBe('true');
  });

  it('moves focus with ArrowDown key', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[0].focus();
    fireEvent.keyDown(checkboxes[0], { key: 'ArrowDown' });
    expect(checkboxes[1].tabIndex).toBe(0);
  });

  it('moves focus with ArrowUp key', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes[0].focus();
    // ArrowUp from 0 wraps to last
    fireEvent.keyDown(checkboxes[0], { key: 'ArrowUp' });
    expect(checkboxes[2].tabIndex).toBe(0);
  });

  it('shows hint toggle for items with hints', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('show hint')).toBeTruthy();
  });

  it('enables Continue when all checked', () => {
    const onComplete = vi.fn();
    render(<Checklist section={mockSection} onComplete={onComplete} />);
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('shows progress counter', () => {
    render(<Checklist section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('0/3')).toBeTruthy();
  });
});
