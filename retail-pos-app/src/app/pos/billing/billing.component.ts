import { Component } from "@angular/core";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { CartService } from "../services/cart.service";

@Component({
  selector: "app-billing",
  template: `
    <div class="page-shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Checkout Desk</p>
          <h1 class="hero-title">POS Billing</h1>
          <div class="hero-subtitle">Scan items fast, create a bill automatically, and keep the cashier flow simple.</div>
        </div>
        <div class="nav-cluster">
          <span class="chip success">Store {{ authService.getStoreId() }}</span>
          <button class="btn secondary" type="button" (click)="startBill()" [disabled]="busy">New Bill</button>
        </div>
      </div>

      <div class="grid" style="grid-template-columns:1.7fr .95fr;align-items:start;">
        <div class="panel">
          <div class="panel-header">
            <div>
              <h2>Cart</h2>
              <p class="muted">Press Enter after a barcode. If there is no active bill yet, the app creates one for you first.</p>
            </div>
            <span class="chip" *ngIf="busy">Working...</span>
          </div>

          <div class="barcode-bar">
            <input [(ngModel)]="barcodeInput" placeholder="Scan barcode or type product code" (keyup.enter)="onBarcodeEnter()" />
            <button class="btn" type="button" (click)="onBarcodeEnter()" [disabled]="busy">Add Item</button>
          </div>

          <div class="empty-state" *ngIf="((cartService.currentBill$ | async)?.items?.length ?? 0) === 0">
            <strong>Cart is empty</strong>
            <span>Try a seeded barcode such as 100001 after category, tax, product, and inventory are set up.</span>
          </div>

          <div class="grid" style="margin-top:16px;" *ngIf="(cartService.currentBill$ | async)?.items?.length">
            <div class="panel subtle-panel" *ngFor="let item of (cartService.currentBill$ | async)?.items">
              <div class="list-row">
                <strong>{{ item.productName }}</strong>
                <span class="chip">{{ item.qty }} item(s)</span>
              </div>
              <div class="muted">Line total</div>
              <div class="stat-value">{{ item.lineTotal | number:'1.2-2' }}</div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <h3>Summary</h3>
              <p class="muted">The bill summary updates after each item is added.</p>
            </div>
          </div>

          <div class="summary-metric">
            <span>Bill ID</span>
            <strong>{{ (cartService.currentBill$ | async)?.billId || "Not started" }}</strong>
          </div>
          <div class="summary-metric">
            <span>Total items</span>
            <strong>{{ (cartService.currentBill$ | async)?.items?.length || 0 }}</strong>
          </div>
          <div class="summary-metric total">
            <span>Total</span>
            <strong>{{ (cartService.currentBill$ | async)?.netAmount || 0 | number:'1.2-2' }}</strong>
          </div>

          <button class="btn tertiary" type="button" (click)="clearBill()" [disabled]="busy">Clear Local Cart</button>
        </div>
      </div>
    </div>
  `
})
export class BillingComponent {
  barcodeInput = "";
  busy = false;

  constructor(
    public cartService: CartService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  startBill(): void {
    this.busy = true;
    this.cartService.startBill(1).pipe(
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

  clearBill(): void {
    this.cartService.clear();
    this.notificationService.info("Local cart view cleared.");
  }
}
