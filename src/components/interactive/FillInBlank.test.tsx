// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FillInBlank } from './FillInBlank';
import type { FillInBlankSection } from '../../core/lesson/types';

const mockSection: FillInBlankSection = {
  type: 'fillInBlank',
  prompt: 'To list files, type ___',
  answer: 'ls',
  acceptAlternates: ['ls -la'],
  hintDetail: 'It starts with l',
};

describe('FillInBlank', () => {
  it('renders prompt text', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    expect(screen.getByText('To list files, type ___')).toBeTruthy();
  });

  it('has form role with aria-labelledby', () => {
    const { container } = render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const form = container.querySelector('[role="form"]');
    expect(form).toBeTruthy();
    expect(form!.getAttribute('aria-labelledby')).toBe('fillinblank-prompt');
  });

  it('has input with aria-label', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');
    expect(input).toBeTruthy();
  });

  it('shows feedback with role="status" after submission', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const feedback = screen.getByRole('status');
    expect(feedback).toBeTruthy();
  });

  it('shows hint with id after wrong answer', () => {
    const { container } = render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const hint = container.querySelector('#fillinblank-hint');
    expect(hint).toBeTruthy();
    expect(hint!.textContent).toContain('It starts with l');
  });

  it('links input to feedback and hint via aria-describedby', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toContain('fillinblank-feedback');
    expect(describedBy).toContain('fillinblank-hint');
  });

  it('accepts correct answer and shows Correct!', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const feedback = screen.getByRole('status');
    expect(feedback.textContent).toContain('Correct!');
  });

  it('accepts alternate answers', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');
    fireEvent.change(input, { target: { value: 'ls -la' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    const feedback = screen.getByRole('status');
    expect(feedback.textContent).toContain('Correct!');
  });

  it('calls onComplete when Continue is clicked after correct answer', () => {
    const onComplete = vi.fn();
    render(<FillInBlank section={mockSection} onComplete={onComplete} />);
    const input = screen.getByLabelText('Your answer');
    fireEvent.change(input, { target: { value: 'ls' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    fireEvent.click(screen.getByText('Continue'));
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it('reveals answer after 2 wrong attempts', () => {
    render(<FillInBlank section={mockSection} onComplete={() => {}} />);
    const input = screen.getByLabelText('Your answer');

    // First wrong attempt
    fireEvent.change(input, { target: { value: 'wrong' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.click(screen.getByText('Try Again'));

    // Second wrong attempt
    fireEvent.change(input, { target: { value: 'wrong2' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('ls', { selector: 'code' })).toBeTruthy();
  });
});
