import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-login",
  template: `
    <div class="page-shell">
      <div class="panel" style="max-width:420px;margin:60px auto;">
        <h1>Retail POS Login</h1>
        <p style="opacity:.75;">Sign in first, then manage staff, products, and inventory from the admin UI.</p>
        <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="grid">
          <input formControlName="username" placeholder="Email / mobile / employee code" />
          <input formControlName="password" type="password" placeholder="Password" />
          <button class="btn" type="submit">Login</button>
          <div *ngIf="errorMessage" style="color:#c2410c">{{ errorMessage }}</div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent {
  errorMessage = "";

  readonly loginForm;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.nonNullable.group({
      username: ["", [Validators.required, Validators.minLength(3)]],
      password: ["", [Validators.required, Validators.minLength(8)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const credentials = this.loginForm.getRawValue();

    this.authService.login({
      username: credentials.username,
      password: credentials.password
    }).subscribe({
      next: () => {
        const role = this.authService.getRole();
        this.router.navigate([role === "Cashier" ? "/pos/billing" : "/admin/dashboard"]);
      },
      error: (error) => {
        this.errorMessage = error?.error?.detail ?? "Login failed";
      }
    });
  }
}
