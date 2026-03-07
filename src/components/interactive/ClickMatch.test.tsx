// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ClickMatch } from './ClickMatch';
import type { MatchSection } from '../../core/lesson/types';

const mockSection: MatchSection = {
  type: 'match',
  instruction: 'Match the command to its description',
  pairs: [
    { left: 'ls', right: 'List files' },
    { left: 'cd', right: 'Change directory' },
    { left: 'pwd', right: 'Print working directory' },
  ],
};

describe('ClickMatch component', () => {
  it('renders instruction and all items', () => {
    render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('Match the command to its description')).toBeTruthy();
    expect(screen.getByText('ls')).toBeTruthy();
    expect(screen.getByText('cd')).toBeTruthy();
    expect(screen.getByText('pwd')).toBeTruthy();
  });

  it('has ARIA listbox roles', () => {
    render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    const listboxes = screen.getAllByRole('listbox');
    expect(listboxes.length).toBe(2);
    expect(listboxes[0].getAttribute('aria-label')).toBe('Items to match');
    expect(listboxes[1].getAttribute('aria-label')).toBe('Match targets');
  });

  it('has option roles on items', () => {
    render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(6); // 3 left + 3 right
  });

  it('shows match counter', () => {
    render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('0/3 matched')).toBeTruthy();
  });

  it('has a group role with aria-labelledby', () => {
    render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-labelledby')).toBe('match-instruction');
  });

  it('has screen reader live region', () => {
    const { container } = render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    const liveRegion = container.querySelector('[aria-live="polite"]');
    expect(liveRegion).toBeTruthy();
  });

  it('selecting left item sets aria-selected', () => {
    render(<ClickMatch section={mockSection} onComplete={() => {}} />);
    const leftOptions = screen.getAllByRole('option').slice(0, 3);

    fireEvent.click(leftOptions[0]); // click "ls"
    expect(leftOptions[0].getAttribute('aria-selected')).toBe('true');
  });
});
