import { Component, OnInit } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { NotificationService } from "../../core/services/notification.service";
import {
  AdminApiService,
  CategoryOption,
  ProductSummary,
  TaxOption
} from "../services/admin-api.service";

@Component({
  selector: "app-products",
  template: `
    <div class="section-head">
      <div>
        <p class="eyebrow">Catalog Control</p>
        <h2 class="section-title">Products & Setup</h2>
      </div>
      <p class="section-caption">Create categories, taxes, and products from the UI, then watch the catalog refresh immediately.</p>
    </div>

    <div class="grid" style="grid-template-columns:1.1fr 1.4fr;align-items:start;">
      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Add Product</h3>
            <p class="muted">Products can only be saved after at least one category and one tax exist.</p>
          </div>
          <span class="chip" *ngIf="isSavingProduct">Saving…</span>
        </div>

        <div class="stack-card">
          <form [formGroup]="categoryForm" (ngSubmit)="saveCategory()" class="grid compact-grid">
            <div class="field">
              <label>Category code</label>
              <input formControlName="categoryCode" placeholder="DAIRY" />
            </div>
            <div class="field">
              <label>Category name</label>
              <input formControlName="categoryName" placeholder="Dairy" />
            </div>
            <button class="btn tertiary" type="submit" [disabled]="isSavingCategory">Add Category</button>
          </form>
        </div>

        <div class="stack-card">
          <form [formGroup]="taxForm" (ngSubmit)="saveTax()" class="grid compact-grid">
            <div class="field">
              <label>Tax code</label>
              <input formControlName="taxCode" placeholder="GST5" />
            </div>
            <div class="field">
              <label>Tax name</label>
              <input formControlName="taxName" placeholder="GST 5%" />
            </div>
            <div class="field">
              <label>Tax rate (%)</label>
              <input formControlName="taxRate" type="number" placeholder="5" />
            </div>
            <label class="check-row"><input type="checkbox" formControlName="isTaxInclusive" /> Inclusive tax</label>
            <button class="btn tertiary" type="submit" [disabled]="isSavingTax">Add Tax</button>
          </form>
        </div>

        <form [formGroup]="form" (ngSubmit)="save()" class="grid form-grid">
          <div class="field">
            <label>SKU</label>
            <input formControlName="sku" placeholder="SKU" />
          </div>
          <div class="field">
            <label>Barcode</label>
            <input formControlName="barcode" placeholder="Barcode" />
          </div>
          <div class="field">
            <label>Product name</label>
            <input formControlName="productName" placeholder="Product name" />
          </div>
          <div class="field">
            <label>Category</label>
            <select formControlName="categoryId">
              <option [ngValue]="0">Select category</option>
              <option *ngFor="let category of categories" [ngValue]="category.categoryId">{{ category.categoryName }}</option>
            </select>
          </div>
          <div class="field">
            <label>Tax</label>
            <select formControlName="taxId">
              <option [ngValue]="0">Select tax</option>
              <option *ngFor="let tax of taxes" [ngValue]="tax.taxId">{{ tax.taxCode }} - {{ tax.taxRate }}%</option>
            </select>
          </div>
          <div class="grid" style="grid-template-columns:1fr 1fr;">
            <div class="field">
              <label>MRP</label>
              <input formControlName="mrp" type="number" placeholder="MRP" />
            </div>
            <div class="field">
              <label>Selling price</label>
              <input formControlName="sellingPrice" type="number" placeholder="Selling price" />
            </div>
          </div>
          <div class="grid" style="grid-template-columns:1fr 1fr 1fr;">
            <div class="field">
              <label>Cost price</label>
              <input formControlName="costPrice" type="number" placeholder="Cost price" />
            </div>
            <div class="field">
              <label>Reorder level</label>
              <input formControlName="reorderLevel" type="number" placeholder="Reorder level" />
            </div>
            <div class="field">
              <label>UOM</label>
              <input formControlName="uom" placeholder="UOM" />
            </div>
          </div>
          <label class="check-row"><input type="checkbox" formControlName="isWeighable" /> Weighable item</label>
          <div class="inline-alert error" *ngIf="form.invalid && form.touched">Fill all required fields and select a category and tax before saving.</div>
          <button class="btn" type="submit" [disabled]="isSavingProduct || categories.length === 0 || taxes.length === 0">Save Product</button>
        </form>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <h3>Products</h3>
            <p class="muted">{{ products.length }} product(s) loaded.</p>
          </div>
          <button class="btn secondary" type="button" (click)="reload()">Refresh</button>
        </div>

        <div class="empty-state" *ngIf="products.length === 0">
          <strong>No products yet</strong>
          <span>Create a category and tax first, then save your first product.</span>
        </div>

        <div class="grid" *ngIf="products.length > 0">
          <div class="panel subtle-panel" *ngFor="let product of products">
            <div class="list-row">
              <strong>{{ product.productName }}</strong>
              <span class="chip" [class.success]="product.isActive">{{ product.isActive ? "Active" : "Inactive" }}</span>
            </div>
            <div class="muted">SKU: {{ product.sku }} · Barcode: {{ product.barcode || "-" }}</div>
            <div class="list-row">
              <span>MRP {{ product.mrp }}</span>
              <span>Selling {{ product.sellingPrice }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProductsComponent implements OnInit {
  products: ProductSummary[] = [];
  categories: CategoryOption[] = [];
  taxes: TaxOption[] = [];
  isSavingProduct = false;
  isSavingCategory = false;
  isSavingTax = false;

  readonly form;
  readonly categoryForm;
  readonly taxForm;

  constructor(
    private formBuilder: FormBuilder,
    private adminApi: AdminApiService,
    private notificationService: NotificationService
  ) {
    this.form = this.formBuilder.nonNullable.group({
      sku: ["", Validators.required],
      barcode: [""],
      productName: ["", Validators.required],
      categoryId: [0, Validators.min(1)],
      uom: ["PCS", Validators.required],
      mrp: [0, Validators.min(0.01)],
      sellingPrice: [0, Validators.min(0.01)],
      costPrice: [0],
      taxId: [0, Validators.min(1)],
      reorderLevel: [0],
      isWeighable: [false]
    });

    this.categoryForm = this.formBuilder.nonNullable.group({
      categoryCode: ["", Validators.required],
      categoryName: ["", Validators.required]
    });

    this.taxForm = this.formBuilder.nonNullable.group({
      taxCode: ["", Validators.required],
      taxName: ["", Validators.required],
      taxRate: [0, Validators.min(0)],
      isTaxInclusive: [false]
    });
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.adminApi.getProducts().subscribe((res) => (this.products = res.items ?? []));
    this.adminApi.getCategories().subscribe((res) => (this.categories = res));
    this.adminApi.getTaxes().subscribe((res) => (this.taxes = res));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notificationService.error("Complete the product form before saving.");
      return;
    }

    const value = this.form.getRawValue();
    if (value.sellingPrice > value.mrp) {
      this.notificationService.error("Selling price cannot be greater than MRP.");
      return;
    }
    this.isSavingProduct = true;

    this.adminApi.createProduct({
      ...value,
      sku: value.sku.toUpperCase().trim(),
      barcode: value.barcode || null,
      productName: value.productName.trim(),
      uom: value.uom.trim().toUpperCase(),
      costPrice: value.costPrice || null
    }).pipe(
      finalize(() => (this.isSavingProduct = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("Product saved successfully.");
        this.form.patchValue({
          sku: "",
          barcode: "",
          productName: "",
          categoryId: 0,
          uom: "PCS",
          mrp: 0,
          sellingPrice: 0,
          costPrice: 0,
          taxId: 0,
          reorderLevel: 0,
          isWeighable: false
        });
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to save product.")
    });
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      this.notificationService.error("Enter both category code and name.");
      return;
    }

    const value = this.categoryForm.getRawValue();
    this.isSavingCategory = true;

    this.adminApi.createCategory({
      categoryCode: value.categoryCode.toUpperCase().trim(),
      categoryName: value.categoryName.trim(),
      parentCategoryId: null,
      sortOrder: this.categories.length + 1
    }).pipe(
      finalize(() => (this.isSavingCategory = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("Category created.");
        this.categoryForm.reset({ categoryCode: "", categoryName: "" });
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to create category.")
    });
  }

  saveTax(): void {
    if (this.taxForm.invalid) {
      this.taxForm.markAllAsTouched();
      this.notificationService.error("Enter a valid tax code, name, and rate.");
      return;
    }

    const value = this.taxForm.getRawValue();
    this.isSavingTax = true;

    this.adminApi.createTax({
      taxCode: value.taxCode.toUpperCase().trim(),
      taxName: value.taxName.trim(),
      taxRate: value.taxRate,
      isTaxInclusive: value.isTaxInclusive,
      effectiveFrom: new Date().toISOString().slice(0, 10)
    }).pipe(
      finalize(() => (this.isSavingTax = false))
    ).subscribe({
      next: () => {
        this.notificationService.success("Tax configuration created.");
        this.taxForm.reset({ taxCode: "", taxName: "", taxRate: 0, isTaxInclusive: false });
        this.reload();
      },
      error: (error) => this.notificationService.error(error?.error?.detail ?? "Failed to create tax.")
    });
  }
}
