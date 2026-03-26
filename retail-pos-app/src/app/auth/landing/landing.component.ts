import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { NotificationService } from "../../core/services/notification.service";
import { WorkspaceContextService } from "../../core/services/workspace-context.service";

@Component({
  selector: "app-landing",
  template: `
    <div class="page-shell auth-shell">
      <div class="auth-panel auth-hero">
        <div class="auth-copy">
          <p class="eyebrow">Retail POS</p>
          <h1 class="hero-title">Store-aware POS for checkout, stock, and control</h1>
          <p class="hero-subtitle">
            Set your store and terminal context once, then move into the right login experience for the role you need.
          </p>
          <div class="auth-badges">
            <span class="chip success">Role isolated</span>
            <span class="chip">Receipts and returns ready</span>
            <span class="chip">Inventory and reports built in</span>
          </div>
        </div>
      </div>

      <div class="panel auth-card">
        <div class="panel-header">
          <div>
            <h2>Store Context</h2>
            <p class="muted">If the store and terminal are not auto-bound, set them here before signing in.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="grid form-grid">
          <div class="field">
            <label class="label-with-icon">
              <mat-icon aria-hidden="true">storefront</mat-icon>
              <span>Store code</span>
            </label>
            <input formControlName="storeCode" placeholder="STR001" maxlength="20" />
          </div>

          <div class="field">
            <label class="label-with-icon">
              <mat-icon aria-hidden="true">point_of_sale</mat-icon>
              <span>Terminal code</span>
            </label>
            <input formControlName="terminalCode" placeholder="TERM-01" maxlength="20" />
          </div>

          <div class="auth-links">
            <span class="muted">Current store: {{ currentStore || "Not set" }}</span>
            <span class="muted">Current terminal: {{ currentTerminal || "Not set" }}</span>
          </div>

          <button class="btn" type="submit">
            <mat-icon aria-hidden="true">save</mat-icon>
            <span>Save Context & Continue</span>
          </button>
          <button class="btn secondary" type="button" (click)="router.navigate(['/auth/login'])">
            <mat-icon aria-hidden="true">login</mat-icon>
            <span>Skip to Login</span>
          </button>
          <a class="auth-links inline-link-with-icon" routerLink="/auth/forgot-password">
            <mat-icon aria-hidden="true">help</mat-icon>
            <span>Forgot your password?</span>
          </a>
        </form>
      </div>
    </div>
  `
})
export class LandingComponent {
  readonly form;

  get currentStore(): string {
    return this.workspaceContext.getStoreCode();
  }

  get currentTerminal(): string {
    return this.workspaceContext.getTerminalCode();
  }

  constructor(
    private formBuilder: FormBuilder,
    private workspaceContext: WorkspaceContextService,
    private notificationService: NotificationService,
    public router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      storeCode: [this.workspaceContext.getStoreCode(), [Validators.required, Validators.minLength(3)]],
      terminalCode: [this.workspaceContext.getTerminalCode(), [Validators.required, Validators.minLength(3)]]
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.workspaceContext.setStoreCode(value.storeCode.toUpperCase().trim());
    this.workspaceContext.setTerminalCode(value.terminalCode.toUpperCase().trim());
    this.notificationService.success("Store context saved.");
    this.router.navigate(["/auth/login"]);
  }
}
