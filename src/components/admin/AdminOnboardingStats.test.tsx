import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AdminOnboardingStats } from './AdminOnboardingStats';
import { apiFetch } from '../../services/api';

vi.mock('../../services/api', () => ({
  apiFetch: vi.fn(),
}));

function mockOk(body: unknown) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

const baseStats = {
  enabled: true,
  provider: 'anthropic' as const,
  totalGenerations: 10,
  uniqueUsers: 3,
  activePlans: 3,
  totalInputTokens: 1000,
  totalOutputTokens: 500,
  usageByProvider: {
    anthropic: { generations: 7, inputTokens: 800, outputTokens: 350 },
    gemini: { generations: 3, inputTokens: 200, outputTokens: 150 },
  },
  recentLogs: [],
};

describe('AdminOnboardingStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders usage cards for Anthropic and Gemini', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce(mockOk(baseStats));

    render(<AdminOnboardingStats />);

    expect(await screen.findByText('AI Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Anthropic Usage')).toBeInTheDocument();
    expect(screen.getByText('Gemini Usage')).toBeInTheDocument();
    expect(screen.getByText('800')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('sends provider setting update when switching to Gemini', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(mockOk(baseStats))
      .mockResolvedValueOnce(mockOk({ key: 'ai_provider', value: 'gemini' }));

    render(<AdminOnboardingStats />);

    expect(await screen.findByText('AI Provider')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gemini' }));

    await waitFor(() => {
      expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/admin/settings/ai_provider', {
        method: 'PUT',
        body: JSON.stringify({ value: 'gemini' }),
      });
    });
  });

  it('tests gemini provider API from admin panel', async () => {
    vi.mocked(apiFetch)
      .mockResolvedValueOnce(mockOk(baseStats))
      .mockResolvedValueOnce(
        mockOk({
          ok: true,
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          latencyMs: 123,
          inputTokens: 11,
          outputTokens: 7,
        }),
      );

    render(<AdminOnboardingStats />);
    expect(await screen.findByText('AI Provider')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Test Gemini API' }));

    await waitFor(() => {
      expect(vi.mocked(apiFetch)).toHaveBeenCalledWith('/api/admin/onboarding/test-provider', {
        method: 'POST',
        body: JSON.stringify({ provider: 'gemini' }),
      });
    });

    expect(await screen.findByText(/gemini OK/i)).toBeInTheDocument();
  });
});
