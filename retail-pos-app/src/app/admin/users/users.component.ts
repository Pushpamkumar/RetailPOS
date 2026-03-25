import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { AdminApiService, UserSummary } from "../services/admin-api.service";

@Component({
  selector: "app-users",
  template: `
    <div class="section-head">
      <div>
        <p class="eyebrow">Access Management</p>
        <h2 class="section-title">Users</h2>
      </div>
      <p class="section-caption">Create staff accounts from the UI. Email or mobile is required because the backend enforces at least one contact method.</p>
    </div>

    <div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Create Staff Account</h3>
            <p class="muted">Employee code should be uppercase. Passwords must match and meet backend complexity rules.</p>
          </div>
          <span class="chip" *ngIf="isSaving">Creating…</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="grid form-grid">
          <div class="field">
            <label>Employee code</label>
            <input formControlName="employeeCode" placeholder="EMP001" />
          </div>
          <div class="field">
            <label>Full name</label>
            <input formControlName="fullName" placeholder="Full name" />
          </div>
          <div class="field">
            <label>Email</label>
            <input formControlName="email" placeholder="Email" />
          </div>
          <div class="field">
            <label>Mobile</label>
            <input formControlName="mobile" placeholder="Mobile" />
          </div>
          <div class="field">
            <label>Role</label>
            <select formControlName="roleId">
              <option [ngValue]="1">Cashier</option>
              <option [ngValue]="2">StoreManager</option>
              <option [ngValue]="3">Admin</option>
              <option [ngValue]="4">InventoryClerk</option>
              <option [ngValue]="5">RegionalManager</option>
            </select>
          </div>
          <div class="field">
            <label>Password</label>
            <input formControlName="password" type="password" placeholder="Password" />
          </div>
          <div class="field">
            <label>Confirm password</label>
            <input formControlName="confirmPassword" type="password" placeholder="Confirm password" />
          </div>
          <div class="inline-alert error" *ngIf="!hasContact()">Email or mobile is required.</div>
          <button class="btn" type="submit" [disabled]="isSaving">Create User</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Users</h3>
            <p class="muted">{{ users.length }} user(s) visible for this store.</p>
          </div>
          <button class="btn secondary" type="button" (click)="reload()">Refresh</button>
        </div>

        <div class="grid">
          <div class="panel subtle-panel" *ngFor="let user of users">
            <div class="list-row">
              <strong>{{ user.fullName }}</strong>
              <span class="chip" [class.success]="user.isActive">{{ user.isActive ? "Active" : "Inactive" }}</span>
            </div>
            <div class="muted">{{ user.roleName }} - {{ user.employeeCode }}</div>
            <div>{{ user.email || user.mobile || "-" }}</div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: UserSummary[] = [];
  isSaving = false;

  readonly form;

  constructor(
    private formBuilder: FormBuilder,
    private adminApi: AdminApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      employeeCode: ["", Validators.required],
      fullName: ["", Validators.required],
      email: [""],
      mobile: [""],
      roleId: [1, Validators.required],
      password: ["", [Validators.required, Validators.minLength(8)]],
      confirmPassword: ["", [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.adminApi.getUsers(this.authService.getStoreId()).subscribe((res) => (this.users = res.items ?? []));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error("Fill the required user fields before saving.");
      return;
    }

    if (!this.hasContact()) {
      this.notificationService.error("Email or mobile is required to create a user.");
      return;
    }

    const value = this.form.getRawValue();
    if (value.password !== value.confirmPassword) {
      this.notificationService.error("Password and confirm password must match.");
      return;
    }
    this.isSaving = true;

    this.adminApi.registerStaff({
      storeId: this.authService.getStoreId(),
      employeeCode: value.employeeCode.toUpperCase().trim(),
      fullName: value.fullName.trim(),
      email: value.email || null,
      mobile: value.mobile || null,
      roleId: value.roleId,
      password: value.password,
      confirmPassword: value.confirmPassword
    }).pipe(
      finalize(() => (this.isSaving = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("User created successfully.");
        this.form.patchValue({
          employeeCode: "",
          fullName: "",
          email: "",
          mobile: "",
          roleId: 1,
          password: "",
          confirmPassword: ""
        });
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to create user.")
    });
  }

  hasContact(): boolean {
    const value = this.form.getRawValue();
    return !!value.email.trim() || !!value.mobile.trim();
  }
}
