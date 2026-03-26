import { Component } from "@angular/core";
import { ThemeService } from "./core/services/theme.service";

@Component({
  selector: "app-root",
  template: `
    <button
      class="theme-toggle"
      type="button"
      [attr.aria-label]="toggleLabel"
      (click)="themeService.toggleTheme()"
    >
      <span class="theme-toggle__icon">
        <mat-icon aria-hidden="true">{{ themeService.isDarkMode ? "light_mode" : "dark_mode" }}</mat-icon>
      </span>
    </button>
    <router-outlet></router-outlet>
    <app-toast-container></app-toast-container>
  `,
  styles: [`
    .theme-toggle {
      position: fixed;
      top: 18px;
      right: 18px;
      z-index: var(--z-floating-control);
      display: inline-grid;
      place-items: center;
      width: 60px;
      height: 60px;
      padding: 0;
      border: 1px solid var(--border-strong);
      border-radius: 50%;
      background: var(--surface-overlay);
      color: var(--ink);
      box-shadow: var(--shadow);
      cursor: pointer;
      backdrop-filter: blur(16px);
      transition: background 240ms ease, border-color 240ms ease, color 240ms ease, transform 120ms ease, box-shadow 240ms ease;
    }

    .theme-toggle:hover {
      transform: translateY(-1px);
      box-shadow: 0 20px 42px rgba(15, 23, 42, 0.18);
    }

    .theme-toggle__icon {
      display: inline-grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--theme-toggle-icon-bg);
      color: var(--theme-primary);
      flex-shrink: 0;
    }
    @media (max-width: 700px) {
      .theme-toggle {
        top: 12px;
        right: 12px;
        width: 52px;
        height: 52px;
      }
    }
  `]
})
export class AppComponent {
  constructor(public themeService: ThemeService) {}

  get toggleLabel(): string {
    return this.themeService.isDarkMode ? "Switch to light mode" : "Switch to dark mode";
  }
}
