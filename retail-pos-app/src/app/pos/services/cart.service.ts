import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, switchMap, tap, throwError } from "rxjs";
import { AuthService } from "../../core/services/auth.service";

export interface BillItemVm {
  billItemId: number;
  sku: string;
  productName: string;
  qty: number;
  lineTotal: number;
}

export interface BillVm {
  billId: number;
  grossAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  items: BillItemVm[];
}

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly billSubject = new BehaviorSubject<BillVm | null>(null);
  readonly currentBill$ = this.billSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {}

  get currentBill(): BillVm | null {
    return this.billSubject.value;
  }

  replaceBill(bill: BillVm): void {
    this.billSubject.next(bill);
  }

  startBill(shiftId: number = this.authService.getShiftId() ?? 0): Observable<BillVm> {
    if (!shiftId) {
      return throwError(() => new Error("Open shift first."));
    }
    return this.http.post<BillVm>("/gateway/orders/bills", { shiftId }).pipe(
      tap((bill) => this.billSubject.next(bill))
    );
  }

  addItem(barcode: string): Observable<BillVm> {
    const currentBill = this.billSubject.value;
    if (!currentBill) {
      return this.startBill().pipe(
        switchMap((bill) => this.http.post<BillVm>("/gateway/orders/bills/cart/items", { billId: bill.billId, barcode, qty: 1 })),
        tap((bill) => this.billSubject.next(bill))
      );
    }

    return this.http.post<BillVm>("/gateway/orders/bills/cart/items", { billId: currentBill.billId, barcode, qty: 1 }).pipe(
      tap((bill) => this.billSubject.next(bill))
    );
  }

  updateQty(itemId: number, qty: number): Observable<BillVm> {
    const billId = this.billSubject.value?.billId ?? 0;
    return this.http.put<BillVm>(`/gateway/orders/bills/cart/items/${itemId}`, { billId, qty }).pipe(
      tap((bill) => this.billSubject.next(bill))
    );
  }

  clear(): void {
    this.billSubject.next(null);
  }
}
