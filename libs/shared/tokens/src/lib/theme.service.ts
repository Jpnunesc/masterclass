import { DOCUMENT } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import { Density, Theme, densities, themes } from './tokens';

const THEME_STORAGE_KEY = 'mc.theme';
const DENSITY_STORAGE_KEY = 'mc.density';
const THEME_ATTR = 'data-theme';
const DENSITY_ATTR = 'data-density';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly storage = this.safeStorage();

  readonly theme = signal<Theme>(this.readTheme());
  readonly density = signal<Density>(this.readDensity());

  constructor() {
    this.applyTheme(this.theme());
    this.applyDensity(this.density());
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.applyTheme(theme);
    this.storage?.setItem(THEME_STORAGE_KEY, theme);
  }

  toggleTheme(): void {
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setDensity(density: Density): void {
    this.density.set(density);
    this.applyDensity(density);
    this.storage?.setItem(DENSITY_STORAGE_KEY, density);
  }

  private applyTheme(theme: Theme): void {
    const root = this.doc.documentElement;
    if (theme === 'light') {
      root.removeAttribute(THEME_ATTR);
    } else {
      root.setAttribute(THEME_ATTR, theme);
    }
  }

  private applyDensity(density: Density): void {
    const root = this.doc.documentElement;
    if (density === 'comfortable') {
      root.removeAttribute(DENSITY_ATTR);
    } else {
      root.setAttribute(DENSITY_ATTR, density);
    }
  }

  private readTheme(): Theme {
    const stored = this.storage?.getItem(THEME_STORAGE_KEY);
    if (stored && (themes as readonly string[]).includes(stored)) {
      return stored as Theme;
    }
    const prefersDark = this.doc.defaultView?.matchMedia?.(
      '(prefers-color-scheme: dark)'
    ).matches;
    return prefersDark ? 'dark' : 'light';
  }

  private readDensity(): Density {
    const stored = this.storage?.getItem(DENSITY_STORAGE_KEY);
    if (stored && (densities as readonly string[]).includes(stored)) {
      return stored as Density;
    }
    return 'comfortable';
  }

  private safeStorage(): Storage | null {
    try {
      return this.doc.defaultView?.localStorage ?? null;
    } catch {
      return null;
    }
  }
}
