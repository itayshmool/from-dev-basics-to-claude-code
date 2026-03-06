// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StreakHeatmap } from './StreakHeatmap';

describe('StreakHeatmap', () => {
  it('renders without crashing with empty activity map', () => {
    const { container } = render(<StreakHeatmap activityMap={{}} />);
    expect(container.querySelector('.inline-flex')).toBeTruthy();
  });

  it('renders legend labels', () => {
    render(<StreakHeatmap activityMap={{}} />);
    expect(screen.getByText('Less')).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('renders day labels', () => {
    render(<StreakHeatmap activityMap={{}} />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();
  });

  it('shows activity count in title attribute', () => {
    const today = new Date().toISOString().slice(0, 10);
    const { container } = render(<StreakHeatmap activityMap={{ [today]: 3 }} />);

    const cell = container.querySelector(`[title="${today}: 3 lessons"]`);
    expect(cell).toBeTruthy();
  });

  it('shows singular "lesson" for count of 1', () => {
    const today = new Date().toISOString().slice(0, 10);
    const { container } = render(<StreakHeatmap activityMap={{ [today]: 1 }} />);

    const cell = container.querySelector(`[title="${today}: 1 lesson"]`);
    expect(cell).toBeTruthy();
  });

  it('renders at least one month label', () => {
    const { container } = render(<StreakHeatmap activityMap={{}} />);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const found = monthLabels.some(m => container.textContent?.includes(m));
    expect(found).toBe(true);
  });
});
