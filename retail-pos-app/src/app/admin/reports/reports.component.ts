import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { AdminApiService, SalesSummary } from "../services/admin-api.service";

@Component({
  selector: "app-reports",
  template: `
    <div class="section-head">
      <div>
        <p class="eyebrow">Business Intelligence</p>
        <h2 class="section-title">Reports</h2>
      </div>
      <p class="section-caption">Use a date range to view sales totals from the backend report endpoint.</p>
    </div>

    <div class="grid" style="grid-template-columns: .95fr 1.45fr; align-items: start;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Sales Range</h3>
            <p class="muted">Reports are store-scoped and use the logged-in store by default.</p>
          </div>
        </div>

        <form [formGroup]="form" (ngSubmit)="load()" class="grid form-grid">
          <div class="field">
            <label>From</label>
            <input type="date" formControlName="from" />
          </div>
          <div class="field">
            <label>To</label>
            <input type="date" formControlName="to" />
          </div>
          <button class="btn" type="submit" [disabled]="busy">Load Report</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Sales Summary</h3>
            <p class="muted">Totals refresh immediately from the API.</p>
          </div>
          <span class="chip success" *ngIf="busy">Loading...</span>
        </div>

        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));">
          <div class="stat-card subtle-panel">
            <span class="stat-label">Total Revenue</span>
            <strong class="stat-value">{{ summary?.totalRevenue ?? 0 | number:'1.2-2' }}</strong>
          </div>
          <div class="stat-card subtle-panel">
            <span class="stat-label">Bills</span>
            <strong class="stat-value">{{ summary?.billCount ?? 0 }}</strong>
          </div>
          <div class="stat-card subtle-panel">
            <span class="stat-label">Average Bill</span>
            <strong class="stat-value">{{ summary?.avgBillValue ?? 0 | number:'1.2-2' }}</strong>
          </div>
          <div class="stat-card subtle-panel">
            <span class="stat-label">Discount</span>
            <strong class="stat-value">{{ summary?.totalDiscount ?? 0 | number:'1.2-2' }}</strong>
          </div>
          <div class="stat-card subtle-panel">
            <span class="stat-label">Tax</span>
            <strong class="stat-value">{{ summary?.totalTax ?? 0 | number:'1.2-2' }}</strong>
          </div>
          <div class="stat-card subtle-panel">
            <span class="stat-label">Gross Revenue</span>
            <strong class="stat-value">{{ summary?.grossRevenue ?? 0 | number:'1.2-2' }}</strong>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsComponent implements OnInit {
  summary: SalesSummary | null = null;
  busy = false;

  readonly form;

  constructor(
    private formBuilder: FormBuilder,
    private adminApi: AdminApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      from: [this.todayOffset(-6), Validators.required],
      to: [this.todayOffset(0), Validators.required]
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.busy = true;
    this.adminApi.getSalesSummary(this.authService.getStoreId(), value.from, value.to).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (res) => {
        this.summary = res;
        this.notificationService.success("Report loaded.");
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to load report.")
    });
  }

  private todayOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
