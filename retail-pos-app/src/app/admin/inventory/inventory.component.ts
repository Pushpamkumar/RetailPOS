import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { NotificationService } from "../../core/services/notification.service";
import { AdminApiService, InventoryItem, ProductSummary } from "../services/admin-api.service";

@Component({
  selector: "app-inventory",
  template: `
    <div class="section-head">
      <div>
        <p class="eyebrow">Stock Control</p>
        <h2 class="section-title">Inventory</h2>
      </div>
      <p class="section-caption">Post stock movements and see the store inventory refresh immediately.</p>
    </div>

    <div class="grid" style="grid-template-columns:1fr 1.4fr;align-items:start;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Inventory Adjustment</h3>
            <p class="muted">Use positive quantities for inward stock. For shrinkage or damage, enter a negative quantity.</p>
          </div>
          <span class="chip" *ngIf="isSaving">Posting…</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="grid form-grid">
          <div class="field">
            <label>Product</label>
            <select formControlName="productId">
              <option [ngValue]="0">Select product</option>
              <option *ngFor="let product of products" [ngValue]="product.productId">{{ product.productName }}</option>
            </select>
          </div>
          <div class="field">
            <label>Adjustment type</label>
            <select formControlName="adjustmentType">
              <option value="Inward">Inward</option>
              <option value="Damage">Damage</option>
              <option value="Shrinkage">Shrinkage</option>
              <option value="ReturnCredit">ReturnCredit</option>
            </select>
          </div>
          <div class="field">
            <label>Quantity</label>
            <input formControlName="quantity" type="number" placeholder="Quantity" />
          </div>
          <div class="field">
            <label>Reason code</label>
            <input formControlName="reasonCode" placeholder="Reason code" />
          </div>
          <div class="field">
            <label>Source document</label>
            <input formControlName="sourceDocument" placeholder="Source document" />
          </div>
          <div class="field">
            <label>Notes</label>
            <input formControlName="notes" placeholder="Notes" />
          </div>
          <button class="btn" type="submit" [disabled]="isSaving || products.length === 0">Post Adjustment</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Store Inventory</h3>
            <p class="muted">{{ inventory.length }} stocked item(s).</p>
          </div>
          <button class="btn secondary" type="button" (click)="reload()">Refresh</button>
        </div>

        <div class="empty-state" *ngIf="inventory.length === 0">
          <strong>No inventory records yet</strong>
          <span>Post an inward adjustment to create stock for a product.</span>
        </div>

        <div class="grid" *ngIf="inventory.length > 0">
          <div class="panel subtle-panel" *ngFor="let item of inventory">
            <div class="list-row">
              <strong>{{ productName(item.productId) }}</strong>
              <span class="chip warn" *ngIf="item.isLowStock">Low stock</span>
            </div>
            <div class="muted">Product ID {{ item.productId }}</div>
            <div class="list-row">
              <span>Stock {{ item.stockOnHand }}</span>
              <span>Reserved {{ item.reservedQty }}</span>
              <span>Reorder {{ item.reorderLevel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  products: ProductSummary[] = [];
  isSaving = false;

  readonly form;

  constructor(
    private formBuilder: FormBuilder,
    private adminApi: AdminApiService,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      productId: [0, Validators.min(1)],
      adjustmentType: ["Inward", Validators.required],
      quantity: [0, Validators.min(0.001)],
      reasonCode: ["MANUAL", Validators.required],
      sourceDocument: [""],
      notes: [""]
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const storeId = this.authService.getStoreId();
    this.adminApi.getInventory(storeId).subscribe((res) => (this.inventory = res.items ?? []));
    this.adminApi.getProducts().subscribe((res) => (this.products = res.items ?? []));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error("Complete the inventory form before posting.");
      return;
    }

    const value = this.form.getRawValue();
    const quantity = value.adjustmentType === "Damage" || value.adjustmentType === "Shrinkage"
      ? -Math.abs(value.quantity)
      : Math.abs(value.quantity);
    this.isSaving = true;

    this.adminApi.createAdjustment({
      storeId: this.authService.getStoreId(),
      productId: value.productId,
      adjustmentType: value.adjustmentType,
      quantity,
      reasonCode: value.reasonCode,
      sourceDocument: value.sourceDocument || null,
      notes: value.notes || null
    }).pipe(
      finalize(() => (this.isSaving = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("Inventory adjustment posted.");
        this.form.patchValue({
          productId: 0,
          adjustmentType: "Inward",
          quantity: 0,
          reasonCode: "MANUAL",
          sourceDocument: "",
          notes: ""
        });
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to post inventory adjustment.")
    });
  }

  productName(productId: number): string {
    return this.products.find((product) => product.productId === productId)?.productName ?? `Product ${productId}`;
  }
}
