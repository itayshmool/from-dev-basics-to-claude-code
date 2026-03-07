// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Quiz } from './Quiz';
import type { QuizSection } from '../../core/lesson/types';

const mockSection: QuizSection = {
  type: 'quiz',
  question: 'What is 2+2?',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  explanation: 'Two plus two equals four.',
};

describe('Quiz component', () => {
  it('renders question and all options', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('What is 2+2?')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('4')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('6')).toBeTruthy();
  });

  it('has radiogroup role and radio roles', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    expect(screen.getByRole('radiogroup')).toBeTruthy();
    const radios = screen.getAllByRole('radio');
    expect(radios.length).toBe(4);
  });

  it('sets aria-checked on selected option', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    const radios = screen.getAllByRole('radio');
    // Initially none checked
    expect(radios[0].getAttribute('aria-checked')).toBe('false');

    fireEvent.click(radios[1]);
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
  });

  it('navigates options with arrow keys', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    const radios = screen.getAllByRole('radio');
    radios[0].focus();

    // ArrowDown moves to next and selects
    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(radios[1].getAttribute('aria-checked')).toBe('true');

    // ArrowUp wraps to last
    fireEvent.keyDown(radios[0], { key: 'ArrowUp' });
    expect(radios[3].getAttribute('aria-checked')).toBe('true');
  });

  it('selects option with Space key', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    const radios = screen.getAllByRole('radio');
    radios[2].focus();

    fireEvent.keyDown(radios[2], { key: ' ' });
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
  });

  it('selects option with number keys', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    // Number key 2 should select index 1
    fireEvent.keyDown(window, { key: '2' });
    const radios = screen.getAllByRole('radio');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  });

  it('shows correct answer on submit', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // select correct answer
    fireEvent.click(screen.getByText('Check Answer'));

    expect(screen.getByText('Two plus two equals four.')).toBeTruthy();
  });

  it('shows "try again" on wrong first attempt', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[0]); // wrong answer
    fireEvent.click(screen.getByText('Check Answer'));

    expect(screen.getByText(/Not quite/)).toBeTruthy();
    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('reveals correct answer after 2 wrong attempts', () => {
    render(<Quiz section={mockSection} onComplete={() => {}} />);
    const radios = screen.getAllByRole('radio');

    // First wrong attempt
    fireEvent.click(radios[0]);
    fireEvent.click(screen.getByText('Check Answer'));
    fireEvent.click(screen.getByText('Try Again'));

    // Second wrong attempt
    fireEvent.click(screen.getAllByRole('radio')[2]);
    fireEvent.click(screen.getByText('Check Answer'));

    expect(screen.getByText(/The correct answer is "4"/)).toBeTruthy();
  });

  it('calls onComplete when Continue is clicked', () => {
    const onComplete = vi.fn();
    render(<Quiz section={mockSection} onComplete={onComplete} />);
    const radios = screen.getAllByRole('radio');
    fireEvent.click(radios[1]); // correct answer
    fireEvent.click(screen.getByText('Check Answer'));
    fireEvent.click(screen.getByText('Continue'));

    expect(onComplete).toHaveBeenCalledOnce();
  });
});
