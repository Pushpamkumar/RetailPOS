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
          <button class="btn" type="button" *ngIf="isAdmin" (click)="openForm()">
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
          <div>{{ getContactLine(user) }}</div>
          <div class="users-card-actions" *ngIf="isAdmin">
            <button class="btn secondary" type="button" (click)="openEditForm(user)">
              <mat-icon aria-hidden="true">edit</mat-icon>
              <span>Update</span>
            </button>
            <button
              class="btn danger"
              type="button"
              [disabled]="isSaving && pendingDeleteUserId === user.userId"
              (click)="deleteUser(user)"
            >
              <mat-icon aria-hidden="true">{{ isSaving && pendingDeleteUserId === user.userId ? "hourglass_top" : "delete" }}</mat-icon>
              <span>{{ isSaving && pendingDeleteUserId === user.userId ? "Deleting..." : "Delete" }}</span>
            </button>
          </div>
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
            <h3 id="users-form-title">{{ isEditing ? "Update Staff Account" : "Create Staff Account" }}</h3>
            <p class="muted">
              {{ isEditing
                ? "Update name, contact details, role, or active state for this staff account."
                : "Employee code should be uppercase. Passwords must match and meet backend complexity rules." }}
            </p>
          </div>
          <div class="users-modal-actions">
            <span class="chip" *ngIf="isSaving">{{ isEditing ? "Saving..." : "Creating..." }}</span>
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
            <input formControlName="employeeCode" placeholder="EMP001" [readonly]="isEditing" />
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
          <div class="field" *ngIf="isEditing">
            <label class="check-row">
              <input type="checkbox" formControlName="isActive" />
              <span>Account active</span>
            </label>
          </div>
          <div class="field" *ngIf="!isEditing">
            <label>Password</label>
            <input formControlName="password" type="password" placeholder="Password" />
          </div>
          <div class="field" *ngIf="!isEditing">
            <label>Confirm password</label>
            <input formControlName="confirmPassword" type="password" placeholder="Confirm password" />
          </div>
          <div class="inline-alert error" *ngIf="showContactRequirement">
            Email or mobile is required.
          </div>
          <button class="btn" type="submit" [disabled]="isSaving">
            <mat-icon aria-hidden="true">{{ isSaving ? "hourglass_top" : (isEditing ? "save" : "person_add") }}</mat-icon>
            <span>{{ isEditing ? "Update User" : "Create User" }}</span>
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

    .users-card-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 14px;
    }

    .users-card-actions .btn {
      flex: 1 1 0;
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
      background: var(--surface-overlay);
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
      background: var(--surface-overlay-strong);
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
  hasAttemptedSave = false;
  editingUser: UserSummary | null = null;
  pendingDeleteUserId: number | null = null;

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
      isActive: [true],
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
    this.prepareCreateMode();
  }

  openEditForm(user: UserSummary): void {
    this.hasAttemptedSave = false;
    this.editingUser = user;
    this.isFormOpen = true;
    this.form.reset({
      employeeCode: user.employeeCode,
      fullName: user.fullName,
      email: user.email ?? "",
      mobile: user.mobile ?? "",
      roleId: this.getRoleId(user.roleName),
      isActive: user.isActive,
      password: "",
      confirmPassword: ""
    });
    this.form.controls.employeeCode.disable();
    this.form.controls.password.clearValidators();
    this.form.controls.confirmPassword.clearValidators();
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
  }

  closeForm(): void {
    if (!this.isSaving) {
      this.resetFormState();
    }
  }

  save(): void {
    this.hasAttemptedSave = true;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error("Fill the required user fields before saving.");
      return;
    }

    if (!this.hasContact()) {
      this.notificationService.error("Email or mobile is required.");
      return;
    }

    const value = this.form.getRawValue();
    if (!this.isEditing && value.password !== value.confirmPassword) {
      this.notificationService.error("Password and confirm password must match.");
      return;
    }
    this.isSaving = true;

    const request = this.isEditing && this.editingUser
      ? this.adminApi.updateUser(this.editingUser.userId, {
        fullName: value.fullName.trim(),
        email: value.email.trim() || null,
        mobile: value.mobile.trim() || null,
        roleId: value.roleId,
        isActive: value.isActive
      })
      : this.adminApi.registerStaff({
        storeId: this.authService.getStoreId(),
        employeeCode: value.employeeCode.toUpperCase().trim(),
        fullName: value.fullName.trim(),
        email: value.email.trim() || null,
        mobile: value.mobile.trim() || null,
        roleId: value.roleId,
        password: value.password,
        confirmPassword: value.confirmPassword
      });

    request.pipe(
      finalize(() => (this.isSaving = false))
    ).subscribe({
      next: () => {
        this.notificationService.success(this.isEditing ? "User updated successfully." : "User created successfully.");
        this.resetFormState();
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? (this.isEditing ? "Failed to update user." : "Failed to create user."))
    });
  }

  hasContact(): boolean {
    const value = this.form.getRawValue();
    return !!value.email.trim() || !!value.mobile.trim();
  }

  deleteUser(user: UserSummary): void {
    if (!this.isAdmin) {
      return;
    }

    if (user.userId === this.authService.getUserId()) {
      this.notificationService.error("You cannot delete your own signed-in account.");
      return;
    }

    if (!window.confirm(`Delete ${user.fullName}? This will deactivate the account.`)) {
      return;
    }

    this.isSaving = true;
    this.pendingDeleteUserId = user.userId;
    this.adminApi.deactivateUser(user.userId).pipe(
      finalize(() => {
        this.isSaving = false;
        this.pendingDeleteUserId = null;
      })
    ).subscribe({
      next: () => {
        this.notificationService.success("User deleted successfully.");
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to delete user.")
    });
  }

  getContactLine(user: UserSummary): string {
    return [user.email, user.mobile].filter((value) => !!value?.trim()).join(" / ") || "-";
  }

  get showContactRequirement(): boolean {
    return this.hasAttemptedSave && !this.hasContact();
  }

  get isEditing(): boolean {
    return !!this.editingUser;
  }

  get isAdmin(): boolean {
    return this.authService.getRole() === "Admin";
  }

  private prepareCreateMode(): void {
    this.hasAttemptedSave = false;
    this.editingUser = null;
    this.isFormOpen = true;
    this.form.reset({
      employeeCode: "",
      fullName: "",
      email: "",
      mobile: "",
      roleId: 1,
      isActive: true,
      password: "",
      confirmPassword: ""
    });
    this.form.controls.employeeCode.enable();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.confirmPassword.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
  }

  private getRoleId(roleName: string): number {
    switch (roleName) {
      case "Cashier":
        return 1;
      case "StoreManager":
        return 2;
      case "Admin":
        return 3;
      case "InventoryClerk":
        return 4;
      case "RegionalManager":
        return 5;
      default:
        return 1;
    }
  }

  private resetFormState(): void {
    this.hasAttemptedSave = false;
    this.editingUser = null;
    this.isFormOpen = false;
    this.form.reset({
      employeeCode: "",
      fullName: "",
      email: "",
      mobile: "",
      roleId: 1,
      isActive: true,
      password: "",
      confirmPassword: ""
    });
    this.form.controls.employeeCode.enable();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.confirmPassword.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.controls.password.updateValueAndValidity();
    this.form.controls.confirmPassword.updateValueAndValidity();
  }
}
