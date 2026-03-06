// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useFocusTrap } from './useFocusTrap';

function createContainer(...elements: HTMLElement[]): HTMLDivElement {
  const container = document.createElement('div');
  elements.forEach(el => container.appendChild(el));
  document.body.appendChild(container);
  return container;
}

function createButton(label: string): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.textContent = label;
  return btn;
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('focuses the first focusable element when opened', () => {
    const btn1 = createButton('First');
    const btn2 = createButton('Second');
    const container = createContainer(btn1, btn2);
    const ref = { current: container };

    renderHook(() => useFocusTrap(ref, true));

    expect(document.activeElement).toBe(btn1);
  });

  it('does not focus anything when isOpen is false', () => {
    const btn = createButton('Btn');
    const container = createContainer(btn);
    const ref = { current: container };

    renderHook(() => useFocusTrap(ref, false));

    expect(document.activeElement).not.toBe(btn);
  });

  it('traps Tab at the last element back to first', () => {
    const btn1 = createButton('First');
    const btn2 = createButton('Last');
    const container = createContainer(btn1, btn2);
    const ref = { current: container };

    renderHook(() => useFocusTrap(ref, true));

    // Focus the last button
    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    // Simulate Tab key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(btn1);
  });

  it('traps Shift+Tab at the first element back to last', () => {
    const btn1 = createButton('First');
    const btn2 = createButton('Last');
    const container = createContainer(btn1, btn2);
    const ref = { current: container };

    renderHook(() => useFocusTrap(ref, true));

    // First element is already focused
    expect(document.activeElement).toBe(btn1);

    // Simulate Shift+Tab
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }));
    expect(document.activeElement).toBe(btn2);
  });

  it('restores focus to previously focused element on close', () => {
    const outsideBtn = createButton('Outside');
    document.body.appendChild(outsideBtn);
    outsideBtn.focus();
    expect(document.activeElement).toBe(outsideBtn);

    const btn = createButton('Inside');
    const container = createContainer(btn);
    const ref = { current: container };

    const { rerender } = renderHook(
      ({ isOpen }) => useFocusTrap(ref, isOpen),
      { initialProps: { isOpen: true } },
    );

    expect(document.activeElement).toBe(btn);

    // Close the trap
    rerender({ isOpen: false });
    expect(document.activeElement).toBe(outsideBtn);
  });

  it('skips disabled buttons', () => {
    const btn1 = document.createElement('button');
    btn1.disabled = true;
    btn1.textContent = 'Disabled';
    const btn2 = createButton('Enabled');
    const container = createContainer(btn1, btn2);
    const ref = { current: container };

    renderHook(() => useFocusTrap(ref, true));

    expect(document.activeElement).toBe(btn2);
  });
});
