import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({ providedIn: "root" })
export class BillingService {
  constructor(private http: HttpClient) {}

  holdBill(billId: number, reason: string): Observable<unknown> {
    return this.http.post(`/gateway/orders/bills/${billId}/hold`, reason);
  }

  collectPayment(payload: unknown): Observable<unknown> {
    return this.http.post("/gateway/orders/payments/collect", payload);
  }

  finalizeBill(billId: number): Observable<unknown> {
    return this.http.post(`/gateway/orders/bills/${billId}/finalize`, {});
  }
}
