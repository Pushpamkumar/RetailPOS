import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { NotificationService } from "../../core/services/notification.service";
import { BillingService, BillDetailVm, ReturnSummaryVm } from "../services/billing.service";

interface ReturnLine {
  selected: boolean;
  billItemId: number;
  productName: string;
  sku: string;
  maxQty: number;
  returnQty: number;
  condition: string;
}

@Component({
  selector: "app-returns",
  template: `
    <div class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Returns & Refunds</p>
          <h2 class="section-title">Return Wizard</h2>
        </div>
        <p class="section-caption">Load a completed bill, choose the eligible items, and initiate the return flow.</p>
      </div>

      <div class="nav-cluster" style="margin-bottom:16px;">
        <a class="nav-pill" routerLink="/pos/billing">Billing</a>
        <a class="nav-pill" routerLink="/pos/history">History</a>
        <a class="nav-pill accent" routerLink="/pos/returns">Returns</a>
      </div>

      <div class="grid" style="grid-template-columns:.9fr 1.1fr;align-items:start;">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Find Bill</h3>
              <p class="muted">Start with the original bill id from history or receipt.</p>
            </div>
          </div>

          <form [formGroup]="form" (ngSubmit)="loadBill()" class="grid form-grid">
            <div class="field">
              <label>Original bill id</label>
              <input type="number" formControlName="originalBillId" min="1" />
            </div>
            <div class="field">
              <label>Reason</label>
              <input formControlName="reason" placeholder="Damaged / wrong item / customer change" />
            </div>
            <div class="field">
              <label>Refund mode</label>
              <select formControlName="refundMode">
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="UPI">UPI</option>
                <option value="WALLET">Wallet</option>
              </select>
            </div>
            <button class="btn" type="submit" [disabled]="busy">Load Bill</button>
          </form>
        </div>

        <div class="panel" *ngIf="bill">
          <div class="panel-header">
            <div>
              <h3>Eligible Items</h3>
              <p class="muted">Select the lines and quantities that should be returned.</p>
            </div>
            <span class="chip success" *ngIf="busy">Working...</span>
          </div>

          <div class="grid">
            <div class="panel subtle-panel" *ngFor="let line of lines; let i = index">
              <div class="list-row">
                <label class="check-row">
                  <input type="checkbox" [(ngModel)]="line.selected" [ngModelOptions]="{ standalone: true }" />
                  {{ line.productName }} ({{ line.sku }})
                </label>
                <span class="chip">Sold {{ line.maxQty }}</span>
              </div>
              <div class="grid compact-grid">
                <div class="field">
                  <label>Return qty</label>
                  <input type="number" [(ngModel)]="line.returnQty" [ngModelOptions]="{ standalone: true }" min="0" [max]="line.maxQty" />
                </div>
                <div class="field">
                  <label>Condition</label>
                  <select [(ngModel)]="line.condition" [ngModelOptions]="{ standalone: true }">
                    <option value="Good">Good</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Opened">Opened</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div class="grid compact-grid" style="margin-top:16px;">
            <button class="btn" type="button" (click)="initiateReturn()" [disabled]="busy">Initiate Return</button>
            <button class="btn secondary" type="button" (click)="approveReturn()" [disabled]="busy || !lastReturn">Approve</button>
            <button class="btn tertiary" type="button" (click)="refundReturn()" [disabled]="busy || !lastReturn">Refund</button>
          </div>
        </div>
      </div>

      <div class="panel" *ngIf="lastReturn" style="margin-top:16px;">
        <div class="panel-header">
          <div>
            <h3>Return Result</h3>
            <p class="muted">Use this return id for approval and refund if needed.</p>
          </div>
        </div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr));">
          <div class="summary-metric"><span>Return ID</span><strong>{{ lastReturn.returnId }}</strong></div>
          <div class="summary-metric"><span>Original Bill</span><strong>{{ lastReturn.originalBillId }}</strong></div>
          <div class="summary-metric"><span>Status</span><strong>{{ lastReturn.status }}</strong></div>
          <div class="summary-metric"><span>Refund Amount</span><strong>{{ lastReturn.refundAmount | number:'1.2-2' }}</strong></div>
        </div>
      </div>
    </div>
  `
})
export class ReturnsComponent {
  bill: BillDetailVm | null = null;
  lines: ReturnLine[] = [];
  lastReturn: ReturnSummaryVm | null = null;
  busy = false;

  readonly form;

  constructor(
    private formBuilder: FormBuilder,
    private billingService: BillingService,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      originalBillId: [0, [Validators.required, Validators.min(1)]],
      reason: ["", [Validators.required, Validators.minLength(3)]],
      refundMode: ["CASH", Validators.required]
    });
  }

  loadBill(): void {
    if (this.form.controls.originalBillId.invalid) {
      this.form.controls.originalBillId.markAsTouched();
      return;
    }

    const billId = Number(this.form.controls.originalBillId.value);
    this.busy = true;
    this.billingService.getBill(billId).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (bill) => {
        this.bill = bill;
        this.lines = bill.items.map((item) => ({
          selected: false,
          billItemId: item.billItemId,
          productName: item.productName,
          sku: item.sku,
          maxQty: Number(item.qty),
          returnQty: Number(item.qty),
          condition: "Good"
        }));
        this.notificationService.success("Bill loaded.");
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to load bill.")
    });
  }

  initiateReturn(): void {
    if (!this.bill) {
      this.notificationService.error("Load a bill first.");
      return;
    }

    const selected = this.lines.filter((line) => line.selected && line.returnQty > 0);
    if (!selected.length) {
      this.notificationService.error("Select at least one item to return.");
      return;
    }

    const reason = this.form.controls.reason.value.trim();
    const refundMode = this.form.controls.refundMode.value;
    this.busy = true;
    this.billingService.initiateReturn({
      originalBillId: this.bill.billId,
      reason,
      refundMode,
      items: selected.map((line) => ({
        billItemId: line.billItemId,
        returnQty: line.returnQty,
        condition: line.condition
      }))
    }).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (res) => {
        this.lastReturn = res;
        this.notificationService.success("Return initiated.");
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to initiate return.")
    });
  }

  approveReturn(): void {
    if (!this.lastReturn) {
      return;
    }
    this.busy = true;
    this.billingService.approveReturn(this.lastReturn.returnId).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (res) => {
        this.lastReturn = res;
        this.notificationService.success("Return approved.");
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to approve return.")
    });
  }

  refundReturn(): void {
    if (!this.lastReturn) {
      return;
    }
    this.busy = true;
    this.billingService.refundReturn(this.lastReturn.returnId, this.form.controls.refundMode.value).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (res) => {
        this.lastReturn = res;
        this.notificationService.success("Refund processed.");
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to refund return.")
    });
  }
}
