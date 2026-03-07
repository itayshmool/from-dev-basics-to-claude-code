// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DragSort } from './DragSort';
import type { DragSortSection } from '../../core/lesson/types';

const mockSection: DragSortSection = {
  type: 'dragSort',
  instruction: 'Sort these into categories',
  categories: [
    { name: 'Navigation', description: 'Moving around' },
    { name: 'File Ops', description: 'Working with files' },
  ],
  items: [
    { text: 'cd', correctCategory: 'Navigation' },
    { text: 'ls', correctCategory: 'Navigation' },
    { text: 'touch', correctCategory: 'File Ops' },
  ],
};

describe('DragSort component', () => {
  it('renders instruction and all items', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('Sort these into categories')).toBeTruthy();
    expect(screen.getByText('cd')).toBeTruthy();
    expect(screen.getByText('ls')).toBeTruthy();
    expect(screen.getByText('touch')).toBeTruthy();
  });

  it('renders category zones', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('Navigation')).toBeTruthy();
    expect(screen.getByText('File Ops')).toBeTruthy();
  });

  it('has ARIA listbox for items pool', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    const listbox = screen.getByRole('listbox');
    expect(listbox.getAttribute('aria-labelledby')).toBe('items-pool-label');
  });

  it('has option roles on unplaced items', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    const options = screen.getAllByRole('option');
    expect(options.length).toBe(3);
  });

  it('sets aria-selected on selected item', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    const options = screen.getAllByRole('option');

    fireEvent.click(options[0]); // select "cd"
    expect(options[0].getAttribute('aria-selected')).toBe('true');
  });

  it('has screen reader live region', () => {
    const { container } = render(<DragSort section={mockSection} onComplete={() => {}} />);
    const liveRegions = container.querySelectorAll('[aria-live="polite"]');
    expect(liveRegions.length).toBeGreaterThanOrEqual(1);
  });

  it('has instruction hint text', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('Tap an item, then tap a category to place it.')).toBeTruthy();
  });

  it('has group role with aria-labelledby for categories', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    const group = screen.getByRole('group');
    expect(group.getAttribute('aria-labelledby')).toBe('dragsort-instruction');
  });

  it('category buttons have aria-label', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    // Categories are disabled buttons when no item selected — find by aria-label
    const nav = screen.getByLabelText(/Category: Navigation/);
    expect(nav).toBeTruthy();
    const fileOps = screen.getByLabelText(/Category: File Ops/);
    expect(fileOps).toBeTruthy();
  });

  it('shows "Check Answers" after all items placed', () => {
    render(<DragSort section={mockSection} onComplete={() => {}} />);
    const options = screen.getAllByRole('option');

    // Place cd in Navigation
    fireEvent.click(options[0]); // select cd
    fireEvent.click(screen.getByLabelText(/Category: Navigation/));

    // Place ls in Navigation
    const remainingOptions = screen.getAllByRole('option');
    fireEvent.click(remainingOptions[0]); // select ls
    fireEvent.click(screen.getByLabelText(/Category: Navigation/));

    // Place touch in File Ops
    const lastOption = screen.getAllByRole('option');
    fireEvent.click(lastOption[0]); // select touch
    fireEvent.click(screen.getByLabelText(/Category: File Ops/));

    expect(screen.getByText('Check Answers')).toBeTruthy();
  });
});
