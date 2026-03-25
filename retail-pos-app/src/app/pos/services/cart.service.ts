import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, switchMap, tap } from "rxjs";

export interface BillItemVm {
  billItemId: number;
  productName: string;
  qty: number;
  lineTotal: number;
}

export interface BillVm {
  billId: number;
  netAmount: number;
  items: BillItemVm[];
}

@Injectable({ providedIn: "root" })
export class CartService {
  private readonly billSubject = new BehaviorSubject<BillVm | null>(null);
  readonly currentBill$ = this.billSubject.asObservable();

  constructor(private http: HttpClient) {}

  startBill(shiftId: number): Observable<BillVm> {
    return this.http.post<BillVm>("/gateway/orders/bills", { shiftId }).pipe(
      tap((bill) => this.billSubject.next(bill))
    );
  }

  addItem(barcode: string): Observable<BillVm> {
    const currentBill = this.billSubject.value;
    if (!currentBill) {
      return this.startBill(1).pipe(
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
