import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface DashboardKpi {
  todayRevenue: number;
  transactionCount: number;
  avgBillValue: number;
  cashCollected: number;
  digitalCollected: number;
  lowStockItems: number;
  pendingReturns: number;
  topProductName?: string | null;
  topProductRevenue: number;
}

export interface ProductCreateRequest {
  sku: string;
  barcode?: string | null;
  productName: string;
  categoryId: number;
  uom: string;
  mrp: number;
  sellingPrice: number;
  costPrice?: number | null;
  taxId: number;
  reorderLevel: number;
  isWeighable: boolean;
}

export interface CategoryCreateRequest {
  categoryCode: string;
  categoryName: string;
  parentCategoryId?: number | null;
  sortOrder: number;
}

export interface TaxCreateRequest {
  taxCode: string;
  taxName: string;
  taxRate: number;
  isTaxInclusive: boolean;
  effectiveFrom: string;
}

export interface ProductSummary {
  productId: number;
  sku: string;
  barcode?: string | null;
  productName: string;
  categoryId: number;
  mrp: number;
  sellingPrice: number;
  taxId: number;
  isActive: boolean;
}

export interface CategoryOption {
  categoryId: number;
  categoryCode: string;
  categoryName: string;
  parentCategoryId?: number | null;
  sortOrder: number;
}

export interface TaxOption {
  taxId: number;
  taxCode: string;
  taxName: string;
  taxRate: number;
  isTaxInclusive: boolean;
}

export interface InventoryItem {
  inventoryId: number;
  storeId: number;
  productId: number;
  stockOnHand: number;
  reservedQty: number;
  reorderLevel: number;
  isLowStock: boolean;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface AdjustmentRequest {
  storeId: number;
  productId: number;
  adjustmentType: string;
  quantity: number;
  reasonCode: string;
  sourceDocument?: string | null;
  notes?: string | null;
}

export interface RegisterStaffRequest {
  storeId: number;
  employeeCode: string;
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  password: string;
  confirmPassword: string;
  roleId: number;
}

export interface UserSummary {
  userId: number;
  fullName: string;
  email?: string | null;
  mobile?: string | null;
  employeeCode: string;
  roleName: string;
  storeId: number;
  isActive: boolean;
  createdAt: string;
}

@Injectable({ providedIn: "root" })
export class AdminApiService {
  constructor(private http: HttpClient) {}

  getDashboard(storeId: number): Observable<DashboardKpi> {
    return this.http.get<DashboardKpi>(`/gateway/admin/dashboard?storeId=${storeId}`);
  }

  getProducts(): Observable<PagedResponse<ProductSummary>> {
    return this.http.get<PagedResponse<ProductSummary>>(`/gateway/catalog/products?page=1&pageSize=50`);
  }

  createProduct(payload: ProductCreateRequest): Observable<ProductSummary> {
    return this.http.post<ProductSummary>("/gateway/catalog/products", payload);
  }

  getCategories(): Observable<CategoryOption[]> {
    return this.http.get<CategoryOption[]>("/gateway/catalog/categories");
  }

  createCategory(payload: CategoryCreateRequest): Observable<CategoryOption> {
    return this.http.post<CategoryOption>("/gateway/catalog/categories", payload);
  }

  getTaxes(): Observable<TaxOption[]> {
    return this.http.get<TaxOption[]>("/gateway/catalog/taxes");
  }

  createTax(payload: TaxCreateRequest): Observable<TaxOption> {
    return this.http.post<TaxOption>("/gateway/catalog/taxes", payload);
  }

  getInventory(storeId: number): Observable<PagedResponse<InventoryItem>> {
    return this.http.get<PagedResponse<InventoryItem>>(`/gateway/admin/inventory?storeId=${storeId}&page=1&pageSize=50`);
  }

  createAdjustment(payload: AdjustmentRequest): Observable<unknown> {
    return this.http.post("/gateway/admin/inventory/adjustments", payload);
  }

  registerStaff(payload: RegisterStaffRequest): Observable<UserSummary> {
    return this.http.post<UserSummary>("/gateway/auth/register", payload);
  }

  getUsers(storeId: number): Observable<PagedResponse<UserSummary>> {
    return this.http.get<PagedResponse<UserSummary>>(`/gateway/auth/users?storeId=${storeId}&page=1&pageSize=50`);
  }
}
