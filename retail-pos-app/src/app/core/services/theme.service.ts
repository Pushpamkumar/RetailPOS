import { Injectable } from "@angular/core";

export type ThemeMode = "light" | "dark";

@Injectable({ providedIn: "root" })
export class ThemeService {
  private readonly storageKey = "retail-pos-theme";
  private currentTheme: ThemeMode = "light";

  constructor() {
    this.initializeTheme();
  }

  get theme(): ThemeMode {
    return this.currentTheme;
  }

  get isDarkMode(): boolean {
    return this.currentTheme === "dark";
  }

  toggleTheme(): void {
    this.setTheme(this.isDarkMode ? "light" : "dark");
  }

  setTheme(theme: ThemeMode, persist = true): void {
    this.currentTheme = theme;

    if (typeof document !== "undefined") {
      document.body.setAttribute("data-theme", theme);
    }

    if (persist && typeof localStorage !== "undefined") {
      localStorage.setItem(this.storageKey, theme);
    }
  }

  private initializeTheme(): void {
    const storedTheme = this.readStoredTheme();
    if (storedTheme) {
      this.setTheme(storedTheme, false);
      return;
    }

    const preferredTheme = this.prefersDarkMode() ? "dark" : "light";
    this.setTheme(preferredTheme, false);
  }

  private readStoredTheme(): ThemeMode | null {
    if (typeof localStorage === "undefined") {
      return null;
    }

    const storedTheme = localStorage.getItem(this.storageKey);
    return storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
  }

  private prefersDarkMode(): boolean {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
}
