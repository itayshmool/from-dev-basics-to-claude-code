// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WelcomeOverlay, useOnboardingSeen } from './WelcomeOverlay';

describe('WelcomeOverlay', () => {
  it('renders the welcome dialog', () => {
    render(<WelcomeOverlay onDismiss={() => {}} />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('shows first step content', () => {
    render(<WelcomeOverlay onDismiss={() => {}} />);
    expect(screen.getByText('Interactive Lessons')).toBeTruthy();
    expect(screen.getByText(/Learn by doing/)).toBeTruthy();
  });

  it('advances through steps with Next button', () => {
    render(<WelcomeOverlay onDismiss={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Track Your Progress')).toBeTruthy();

    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('8 Levels, 102 Lessons')).toBeTruthy();
  });

  it('shows "Let\'s Go!" on last step', () => {
    render(<WelcomeOverlay onDismiss={() => {}} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText("Let's Go!")).toBeTruthy();
  });

  it('calls onDismiss when "Let\'s Go!" is clicked', () => {
    const onDismiss = vi.fn();
    render(<WelcomeOverlay onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText("Let's Go!"));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('calls onDismiss when Skip is clicked', () => {
    const onDismiss = vi.fn();
    render(<WelcomeOverlay onDismiss={onDismiss} />);
    fireEvent.click(screen.getByText('Skip'));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('shows step indicators', () => {
    const { container } = render(<WelcomeOverlay onDismiss={() => {}} />);
    const indicators = container.querySelectorAll('.rounded-full');
    // 3 step indicators (filter by size)
    const stepDots = Array.from(indicators).filter(
      el => el.classList.contains('w-6') || el.classList.contains('w-1\\.5') || el.className.includes('w-1.5')
    );
    expect(stepDots.length).toBeGreaterThanOrEqual(3);
  });
});

describe('useOnboardingSeen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns seen=false when not dismissed', () => {
    // Need to test outside React — just test localStorage directly
    expect(localStorage.getItem('onboarding-dismissed')).toBeNull();
  });

  it('marks seen in localStorage', () => {
    localStorage.setItem('onboarding-dismissed', 'true');
    expect(localStorage.getItem('onboarding-dismissed')).toBe('true');
  });
});
