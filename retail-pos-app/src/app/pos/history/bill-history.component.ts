import { Component, OnInit } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { PrinterService } from "../../core/services/printer.service";
import { WorkspaceContextService } from "../../core/services/workspace-context.service";
import { BillingService, BillDetailVm, BillSummaryVm, HeldBillVm } from "../services/billing.service";
import { CartService } from "../services/cart.service";

@Component({
  selector: "app-bill-history",
  template: `
    <div class="section-head">
      <div>
        <p class="eyebrow">Billing Records</p>
        <h2 class="section-title">Bill History & Held Sessions</h2>
      </div>
      <p class="section-caption">Review finalized bills, print receipts again, and resume held carts when needed.</p>
    </div>

    <div class="nav-cluster" style="margin-bottom:16px;">
      <button class="nav-pill" [class.is-active]="tab === 'history'" type="button" (click)="tab = 'history'">Completed Bills</button>
      <button class="nav-pill" [class.is-active]="tab === 'held'" type="button" (click)="tab = 'held'; loadHeld()">Held Bills</button>
    </div>

    <div *ngIf="tab === 'history'" class="grid" style="grid-template-columns: .9fr 1.1fr; align-items:start;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Filter Bills</h3>
            <p class="muted">Use dates, cashier id, or status to narrow the list.</p>
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
          <div class="field">
            <label>Cashier user id</label>
            <input type="number" formControlName="cashierUserId" min="0" />
          </div>
          <div class="field">
            <label>Status</label>
            <select formControlName="status">
              <option value="">Any</option>
              <option value="Paid">Paid</option>
              <option value="Held">Held</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <button class="btn" type="submit" [disabled]="busy">Load Bills</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Completed Bills</h3>
            <p class="muted">{{ bills.length }} bill(s) found for {{ workspaceContext.getStoreCode() || ("Store " + authService.getStoreId()) }}.</p>
          </div>
          <span class="chip success" *ngIf="busy">Loading...</span>
        </div>

        <div class="empty-state" *ngIf="bills.length === 0">
          <strong>No bills yet</strong>
          <span>Once payment is finalized, the bill will appear here for search and reprint.</span>
        </div>

        <div class="grid" *ngIf="bills.length > 0">
          <button class="panel subtle-panel text-left" type="button" *ngFor="let bill of bills" (click)="selectBill(bill.billId)">
            <div class="list-row">
              <strong>{{ bill.billNumber || ('Bill #' + bill.billId) }}</strong>
              <span class="chip">{{ bill.status }}</span>
            </div>
            <div class="list-row">
              <span>{{ bill.billDate | date:'mediumDate' }}</span>
              <span>{{ bill.netAmount | number:'1.2-2' }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="tab === 'history' && selectedBill" class="panel" style="margin-top:16px;">
      <div class="panel-header">
        <div>
          <h3>Bill Detail</h3>
          <p class="muted">Print again or send receipt for the selected bill.</p>
        </div>
        <div class="nav-cluster">
          <button class="btn secondary" type="button" (click)="printSelected()">Reprint</button>
          <button class="btn secondary" type="button" (click)="sendReceipt()">Send Receipt</button>
        </div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(auto-fit,minmax(220px,1fr));">
        <div class="summary-metric"><span>Bill No</span><strong>{{ selectedBill.billNumber || selectedBill.billId }}</strong></div>
        <div class="summary-metric"><span>Status</span><strong>{{ selectedBill.status }}</strong></div>
        <div class="summary-metric"><span>Gross</span><strong>{{ selectedBill.grossAmount | number:'1.2-2' }}</strong></div>
        <div class="summary-metric"><span>Net</span><strong>{{ selectedBill.netAmount | number:'1.2-2' }}</strong></div>
      </div>

      <div class="grid" style="grid-template-columns: repeat(auto-fit,minmax(240px,1fr)); margin-top:16px;">
        <div class="panel subtle-panel">
          <h4>Items</h4>
          <div class="grid">
            <div *ngFor="let item of selectedBill.items" class="list-row">
              <span>{{ item.productName }} ({{ item.sku }})</span>
              <strong>{{ item.lineTotal | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
        <div class="panel subtle-panel">
          <h4>Payments</h4>
          <div class="grid">
            <div *ngFor="let payment of selectedBill.payments" class="list-row">
              <span>{{ payment.paymentMode }}</span>
              <strong>{{ payment.amount | number:'1.2-2' }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="tab === 'held'" class="grid" style="grid-template-columns: 1fr;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Held Bills</h3>
            <p class="muted">Resume a held cart back into the billing screen.</p>
          </div>
          <span class="chip success" *ngIf="busy">Loading...</span>
        </div>

        <div class="empty-state" *ngIf="heldBills.length === 0">
          <strong>No held bills</strong>
          <span>Use Hold in the billing screen to park a cart for later.</span>
        </div>

        <div class="grid" *ngIf="heldBills.length > 0">
          <div class="panel subtle-panel" *ngFor="let bill of heldBills">
            <div class="list-row">
              <strong>{{ bill.billId }}</strong>
              <span class="chip">Held</span>
            </div>
            <div class="list-row">
              <span>{{ bill.heldAt | date:'short' }}</span>
              <span>{{ bill.netAmount | number:'1.2-2' }}</span>
            </div>
            <button class="btn" type="button" (click)="resumeHeld(bill.billId)">Resume Bill</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BillHistoryComponent implements OnInit {
  readonly form;
  bills: BillSummaryVm[] = [];
  heldBills: HeldBillVm[] = [];
  selectedBill: BillDetailVm | null = null;
  busy = false;
  tab: "history" | "held" = "history";

  constructor(
    private formBuilder: FormBuilder,
    private billingService: BillingService,
    private cartService: CartService,
    private printerService: PrinterService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public workspaceContext: WorkspaceContextService,
    private router: Router
  ) {
    this.form = this.formBuilder.nonNullable.group({
      from: [this.todayOffset(-6)],
      to: [this.todayOffset(0)],
      cashierUserId: [0],
      status: [""]
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadHeld();
  }

  load(): void {
    const value = this.form.getRawValue();
    this.busy = true;
    this.billingService.getBills({
      from: value.from,
      to: value.to,
      cashierUserId: value.cashierUserId || undefined,
      status: value.status || undefined,
      page: 1,
      pageSize: 50
    }).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (res) => {
        this.bills = res.items ?? [];
        if (this.bills.length > 0) {
          this.selectBill(this.bills[0].billId);
        } else {
          this.selectedBill = null;
        }
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to load bills.")
    });
  }

  loadHeld(): void {
    this.billingService.getHeldBills().subscribe({
      next: (res) => (this.heldBills = res ?? []),
      error: () => this.heldBills = []
    });
  }

  selectBill(billId: number): void {
    this.busy = true;
    this.billingService.getBill(billId).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (bill) => (this.selectedBill = bill),
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to load bill.")
    });
  }

  printSelected(): void {
    if (!this.selectedBill) {
      return;
    }
    this.printerService.printReceipt(this.buildReceiptHtml(this.selectedBill));
  }

  sendReceipt(): void {
    if (!this.selectedBill) {
      return;
    }
    this.billingService.sendReceipt(this.selectedBill.billId).subscribe({
      next: () => this.notificationService.success("Receipt sent."),
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to send receipt.")
    });
  }

  resumeHeld(billId: number): void {
    this.busy = true;
    this.billingService.resumeBill(billId).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: (bill) => {
        this.cartService.replaceBill(bill);
        this.notificationService.success("Held bill resumed.");
        this.router.navigate(["/pos/billing"]);
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to resume bill.")
    });
  }

  private buildReceiptHtml(bill: BillDetailVm): string {
    const rows = bill.items.map((item) => `
      <tr>
        <td>${item.productName}</td>
        <td style="text-align:right;">${item.qty}</td>
        <td style="text-align:right;">${item.lineTotal.toFixed(2)}</td>
      </tr>
    `).join("");

    return `
      <div style="font-family:Segoe UI,Arial,sans-serif;padding:20px;max-width:420px;">
        <h2 style="margin:0 0 8px;">Retail POS Receipt</h2>
        <div style="font-size:12px;color:#555;margin-bottom:12px;">Bill ${bill.billNumber || bill.billId} | Status ${bill.status}</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr><th align="left">Item</th><th align="right">Qty</th><th align="right">Total</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <hr />
        <div style="display:flex;justify-content:space-between;"><span>Gross</span><strong>${bill.grossAmount.toFixed(2)}</strong></div>
        <div style="display:flex;justify-content:space-between;"><span>Tax</span><strong>${bill.taxAmount.toFixed(2)}</strong></div>
        <div style="display:flex;justify-content:space-between;"><span>Discount</span><strong>${bill.discountAmount.toFixed(2)}</strong></div>
        <div style="display:flex;justify-content:space-between;font-size:16px;"><span>Total</span><strong>${bill.netAmount.toFixed(2)}</strong></div>
      </div>
    `;
  }

  private todayOffset(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().slice(0, 10);
  }
}
