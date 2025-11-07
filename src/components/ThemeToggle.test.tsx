import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    // ensure matchMedia exists
    (window as any).matchMedia = (query: string) => ({ matches: false, media: query, addListener: () => {}, removeListener: () => {} });
  });

  it('reads initial preference from localStorage', () => {
    localStorage.setItem('theme', 'dark');
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('toggles theme and persists to localStorage', () => {
    render(<ThemeToggle />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(localStorage.getItem('theme')).toBe('dark');

    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
