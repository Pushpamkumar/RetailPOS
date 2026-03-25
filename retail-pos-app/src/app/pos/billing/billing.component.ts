import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { Component } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { finalize, switchMap } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { PrinterService } from "../../core/services/printer.service";
import { WorkspaceContextService } from "../../core/services/workspace-context.service";
import { BillingService, BillReceiptVm } from "../services/billing.service";
import { CartService } from "../services/cart.service";
import { PaymentSubmission } from "../payment/payment-modal.component";

@Component({
  selector: "app-billing",
  template: `
    <div class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Checkout Desk</p>
          <h1 class="hero-title">POS Billing</h1>
          <div class="hero-subtitle">
            Start a shift, scan products, collect payment, and print the receipt without leaving the screen.
          </div>
        </div>
        <div class="nav-cluster">
          <span class="chip success">Role {{ authService.getRole() }}</span>
          <span class="chip">Store {{ authService.getStoreId() }}</span>
          <span class="chip">Terminal {{ workspaceContext.getTerminalCode() || "TERM-01" }}</span>
          <span class="chip warn" *ngIf="!authService.getShiftId()">Shift closed</span>
          <span class="chip success" *ngIf="authService.getShiftId()">Shift #{{ authService.getShiftId() }}</span>
        </div>
      </div>

      <div class="nav-cluster" style="margin-bottom:16px;">
        <a class="nav-pill accent" routerLink="/pos/billing">Billing</a>
        <a class="nav-pill" routerLink="/pos/history">History</a>
        <a class="nav-pill" routerLink="/pos/returns">Returns</a>
      </div>

      <div class="grid" style="grid-template-columns:1.05fr .95fr;align-items:start;">
        <div class="grid" style="gap:16px;">
          <div class="panel" *ngIf="!authService.getShiftId()">
            <div class="panel-header">
              <div>
                <h2>Open Shift</h2>
                <p class="muted">A shift is required before billing. Enter the opening cash and terminal id once.</p>
              </div>
            </div>

            <form [formGroup]="shiftForm" (ngSubmit)="openShift()" class="grid form-grid compact-grid">
              <div class="field">
                <label>Terminal ID</label>
                <input formControlName="terminalId" placeholder="TERM-01" />
              </div>
              <div class="field">
                <label>Opening cash</label>
                <input type="number" formControlName="openingCash" min="0" step="0.01" />
              </div>
              <button class="btn" type="submit" [disabled]="busy">Open Shift & Start Billing</button>
            </form>
          </div>

          <div class="panel">
            <div class="panel-header">
              <div>
                <h2>Cart</h2>
                <p class="muted">Press Enter after a barcode. A bill will be created automatically when needed.</p>
              </div>
              <span class="chip" *ngIf="busy">Working...</span>
            </div>

            <div class="barcode-bar">
              <input [(ngModel)]="barcodeInput" placeholder="Scan barcode or type product code" (keyup.enter)="onBarcodeEnter()" />
              <button class="btn" type="button" (click)="onBarcodeEnter()" [disabled]="busy || !authService.getShiftId()">Add Item</button>
            </div>

            <div class="empty-state" *ngIf="!currentBill?.items?.length">
              <strong>Cart is empty</strong>
              <span>Try a seeded barcode such as 100001 after opening a shift and creating a bill.</span>
            </div>

            <div class="grid" style="margin-top:16px;" *ngIf="currentBill?.items?.length">
              <div class="panel subtle-panel" *ngFor="let item of currentBill?.items">
                <div class="list-row">
                  <strong>{{ item.productName }}</strong>
                  <span class="chip">{{ item.qty }} item(s)</span>
                </div>
                <div class="muted">SKU {{ item.sku }}</div>
                <div class="muted">Line total</div>
                <div class="stat-value">{{ item.lineTotal | number:'1.2-2' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid" style="gap:16px;">
          <div class="panel">
            <div class="panel-header">
              <div>
                <h3>Bill Summary</h3>
                <p class="muted">The bill updates as items are scanned.</p>
              </div>
            </div>

            <div class="summary-metric">
              <span>Bill ID</span>
              <strong>{{ currentBill?.billId || "Not started" }}</strong>
            </div>
            <div class="summary-metric">
              <span>Total items</span>
              <strong>{{ currentBill?.items?.length || 0 }}</strong>
            </div>
            <div class="summary-metric">
              <span>Gross</span>
              <strong>{{ currentBill?.grossAmount || 0 | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-metric">
              <span>Tax</span>
              <strong>{{ currentBill?.taxAmount || 0 | number:'1.2-2' }}</strong>
            </div>
            <div class="summary-metric total">
              <span>Total</span>
              <strong>{{ currentBill?.netAmount || 0 | number:'1.2-2' }}</strong>
            </div>

            <div class="grid compact-grid">
              <button class="btn secondary" type="button" (click)="startBill()" [disabled]="busy || !authService.getShiftId()">
                New Bill
              </button>
              <button class="btn" type="button" (click)="openPayment()" [disabled]="busy || !currentBill">
                Pay & Finalize
              </button>
            </div>

            <div class="field" style="margin-top:12px;">
              <label>Hold reason</label>
              <input [(ngModel)]="holdReason" placeholder="Optional hold reason" />
            </div>
            <button class="btn tertiary" type="button" (click)="holdCurrentBill()" [disabled]="busy || !currentBill">
              Hold Bill
            </button>

            <button class="btn tertiary" type="button" (click)="clearBill()" [disabled]="busy">Clear Local Cart</button>
          </div>

          <div class="panel" *ngIf="receiptHtml">
            <div class="panel-header">
              <div>
                <h3>Receipt</h3>
                <p class="muted">The last finalized bill is rendered here and sent to the printer.</p>
              </div>
              <button class="btn secondary" type="button" (click)="printReceipt()">Print Again</button>
            </div>
            <div class="receipt-preview" [innerHTML]="safeReceiptHtml"></div>
          </div>
        </div>
      </div>

      <app-payment-modal
        [visible]="paymentOpen"
        [amount]="currentBill?.netAmount ?? 0"
        (paymentClosed)="paymentOpen = false"
        (paymentComplete)="completePayment($event)"
      ></app-payment-modal>
    </div>
  `
})
export class BillingComponent {
  barcodeInput = "";
  busy = false;
  paymentOpen = false;
  receiptHtml = "";
  safeReceiptHtml: SafeHtml = "";
  holdReason = "";

  readonly shiftForm;

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    private billingService: BillingService,
    private formBuilder: FormBuilder,
    private sanitizer: DomSanitizer,
    private printerService: PrinterService,
    private notificationService: NotificationService,
    public workspaceContext: WorkspaceContextService
  ) {
    this.shiftForm = this.formBuilder.nonNullable.group({
      terminalId: [this.workspaceContext.getTerminalCode() || "TERM-01", [Validators.required, Validators.minLength(3)]],
      openingCash: [0, [Validators.required, Validators.min(0)]]
    });
  }

  get currentBill() {
    return this.cartService.currentBill;
  }

  openShift(): void {
    if (this.shiftForm.invalid) {
      this.shiftForm.markAllAsTouched();
      return;
    }

    this.busy = true;
    const value = this.shiftForm.getRawValue();

    this.authService.startShift({
      storeId: this.authService.getStoreId(),
      terminalId: value.terminalId.trim(),
      openingCash: value.openingCash
    }).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("Shift opened successfully.");
        this.startBill();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to open shift.")
    });
  }

  startBill(): void {
    this.busy = true;
    this.cartService.startBill().pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: () => this.notificationService.success("New bill started."),
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to start bill.")
    });
  }

  onBarcodeEnter(): void {
    if (!this.barcodeInput.trim()) {
      return;
    }

    if (!this.authService.getShiftId()) {
      this.notificationService.error("Open a shift before adding items.");
      return;
    }

    const barcode = this.barcodeInput.trim();
    this.barcodeInput = "";
    this.busy = true;

    this.cartService.addItem(barcode).pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: () => this.notificationService.success(`Added item ${barcode} to the cart.`),
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to add item.")
    });
  }

  openPayment(): void {
    if (!this.currentBill) {
      this.notificationService.error("Create a bill before collecting payment.");
      return;
    }

    this.paymentOpen = true;
  }

  completePayment(payload: PaymentSubmission): void {
    const bill = this.currentBill;
    if (!bill) {
      this.paymentOpen = false;
      return;
    }

    this.busy = true;
    this.billingService.collectPayment({
      billId: bill.billId,
      paymentMode: payload.paymentMode,
      amount: payload.amount,
      referenceNo: payload.referenceNo,
      cashReceived: payload.cashReceived
    }).pipe(
      switchMap(() => this.billingService.finalizeBill(bill.billId)),
      finalize(() => {
        this.busy = false;
        this.paymentOpen = false;
      })
    ).subscribe({
      next: (receipt) => this.onReceipt(receipt),
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to collect payment.")
    });
  }

  clearBill(): void {
    this.cartService.clear();
    this.receiptHtml = "";
    this.safeReceiptHtml = "";
    this.notificationService.info("Local cart view cleared.");
  }

  holdCurrentBill(): void {
    const bill = this.currentBill;
    if (!bill) {
      this.notificationService.error("Create a bill before holding it.");
      return;
    }

    this.busy = true;
    this.billingService.holdBill(bill.billId, this.holdReason.trim() || "Held from billing screen").pipe(
      finalize(() => (this.busy = false))
    ).subscribe({
      next: () => {
        this.cartService.clear();
        this.holdReason = "";
        this.notificationService.success("Bill placed on hold.");
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to hold bill.")
    });
  }

  printReceipt(): void {
    if (this.receiptHtml) {
      this.printerService.printReceipt(this.receiptHtml);
    }
  }

  private onReceipt(receipt: BillReceiptVm): void {
    this.receiptHtml = receipt.receiptHtml;
    this.safeReceiptHtml = this.sanitizer.bypassSecurityTrustHtml(receipt.receiptHtml);
    this.printerService.printReceipt(receipt.receiptHtml);
    this.notificationService.success(`Bill ${receipt.billNumber} finalized and printed.`);
    this.cartService.clear();
  }
}
