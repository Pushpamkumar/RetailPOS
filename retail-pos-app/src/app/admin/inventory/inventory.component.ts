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

    <div class="panel inventory-shell">
      <div class="panel-header inventory-toolbar">
        <div>
          <h3>Store Inventory</h3>
          <p class="muted">{{ inventory.length }} stocked item(s). Use the popup form to post stock movements.</p>
        </div>
        <div class="inventory-actions">
          <button class="btn" type="button" (click)="openForm()">
            <mat-icon aria-hidden="true">edit_note</mat-icon>
            <span>Post Adjustment</span>
          </button>
          <button class="btn secondary" type="button" (click)="reload()">
            <mat-icon aria-hidden="true">refresh</mat-icon>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div class="empty-state" *ngIf="inventory.length === 0">
        <strong>No inventory records yet</strong>
        <span>Open the form and post an inward adjustment to create stock for a product.</span>
      </div>

      <div class="grid inventory-grid" *ngIf="inventory.length > 0">
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

    <div class="modal-backdrop inventory-modal-backdrop" *ngIf="isFormOpen" (click)="closeForm()">
      <div
        class="modal-panel inventory-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-adjustment-title"
        (click)="$event.stopPropagation()"
      >
        <div class="panel-header inventory-modal-header">
          <div>
            <h3 id="inventory-adjustment-title">Inventory Adjustment</h3>
            <p class="muted">Use positive quantities for inward stock. For shrinkage or damage, enter a negative quantity.</p>
          </div>
          <div class="inventory-modal-actions">
            <span class="chip" *ngIf="isSaving">Posting...</span>
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
          <button class="btn" type="submit" [disabled]="isSaving || products.length === 0">
            <mat-icon aria-hidden="true">{{ isSaving ? "hourglass_top" : "publish" }}</mat-icon>
            <span>Post Adjustment</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .inventory-shell {
      display: grid;
      gap: 18px;
    }

    .inventory-toolbar {
      align-items: center;
    }

    .inventory-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .inventory-grid {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    .inventory-modal-backdrop {
      backdrop-filter: blur(4px);
    }

    .inventory-modal-panel {
      width: min(720px, 100%);
      max-height: min(90vh, 860px);
      overflow: auto;
      padding: 24px;
    }

    .inventory-modal-header {
      align-items: flex-start;
    }

    .inventory-modal-actions {
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
      .inventory-toolbar,
      .inventory-modal-header {
        align-items: start;
        flex-direction: column;
      }

      .inventory-actions,
      .inventory-modal-actions {
        width: 100%;
        justify-content: space-between;
      }

      .inventory-actions .btn {
        flex: 1 1 0;
      }

      .inventory-modal-panel {
        padding: 20px;
      }
    }
  `]
})
export class InventoryComponent implements OnInit {
  inventory: InventoryItem[] = [];
  products: ProductSummary[] = [];
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
        this.closeForm();
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to post inventory adjustment.")
    });
  }

  productName(productId: number): string {
    return this.products.find((product) => product.productId === productId)?.productName ?? `Product ${productId}`;
  }
}
