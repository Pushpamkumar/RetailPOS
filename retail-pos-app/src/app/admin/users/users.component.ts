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

    <div class="panel users-shell">
      <div class="panel-header users-toolbar">
        <div>
          <h3>Users</h3>
          <p class="muted">{{ users.length }} user(s) visible for this store.</p>
        </div>
        <div class="users-actions">
          <button class="btn" type="button" (click)="openForm()">
            <mat-icon aria-hidden="true">person_add</mat-icon>
            <span>Create User</span>
          </button>
          <button class="btn secondary" type="button" (click)="reload()">
            <mat-icon aria-hidden="true">refresh</mat-icon>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div class="empty-state" *ngIf="users.length === 0">
        <strong>No users yet</strong>
        <span>Open the form to create the first staff account for this store.</span>
      </div>

      <div class="grid users-grid" *ngIf="users.length > 0">
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

    <div class="modal-backdrop users-modal-backdrop" *ngIf="isFormOpen" (click)="closeForm()">
      <div
        class="modal-panel users-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="users-form-title"
        (click)="$event.stopPropagation()"
      >
        <div class="panel-header users-modal-header">
          <div>
            <h3 id="users-form-title">Create Staff Account</h3>
            <p class="muted">Employee code should be uppercase. Passwords must match and meet backend complexity rules.</p>
          </div>
          <div class="users-modal-actions">
            <span class="chip" *ngIf="isSaving">Creating...</span>
            <button
              class="modal-close"
              type="button"
              aria-label="Close form"
              (click)="closeForm()"
            >
              <mat-icon aria-hidden="true">close</mat-icon>
            </button>
          </div>
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
          <button class="btn" type="submit" [disabled]="isSaving">
            <mat-icon aria-hidden="true">{{ isSaving ? "hourglass_top" : "person_add" }}</mat-icon>
            <span>Create User</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .users-shell {
      display: grid;
      gap: 18px;
    }

    .users-toolbar {
      align-items: center;
    }

    .users-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .users-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .users-modal-backdrop {
      backdrop-filter: blur(4px);
    }

    .users-modal-panel {
      width: min(720px, 100%);
      max-height: min(90vh, 860px);
      overflow: auto;
      padding: 24px;
    }

    .users-modal-header {
      align-items: flex-start;
    }

    .users-modal-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-close {
      width: 42px;
      height: 42px;
      border: 1px solid var(--border);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.9);
      color: var(--ink);
      font-size: 28px;
      line-height: 1;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease;
    }

    .modal-close:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow);
      background: #fff;
    }

    @media (max-width: 700px) {
      .users-toolbar,
      .users-modal-header {
        align-items: start;
        flex-direction: column;
      }

      .users-actions,
      .users-modal-actions {
        width: 100%;
        justify-content: space-between;
      }

      .users-actions .btn {
        flex: 1 1 0;
      }

      .users-modal-panel {
        padding: 20px;
      }
    }
  `]
})
export class UsersComponent implements OnInit {
  users: UserSummary[] = [];
  isSaving = false;
  isFormOpen = false;

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

  openForm(): void {
    this.isFormOpen = true;
  }

  closeForm(): void {
    if (!this.isSaving) {
      this.isFormOpen = false;
    }
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
        this.closeForm();
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
