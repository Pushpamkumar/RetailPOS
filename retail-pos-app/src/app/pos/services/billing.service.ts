import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface BillSummaryVm {
  billId: number;
  billNumber?: string | null;
  billDate: string;
  netAmount: number;
  status: string;
}

export interface PaymentVm {
  paymentId: number;
  paymentMode: string;
  amount: number;
  referenceNo?: string | null;
  status: string;
}

export interface CollectPaymentRequest {
  billId: number;
  paymentMode: "CASH" | "CARD" | "UPI" | "WALLET";
  amount: number;
  referenceNo: string | null;
  cashReceived: number | null;
}

export interface BillReceiptVm {
  billId: number;
  billNumber: string;
  netAmount: number;
  finalizedAt: string;
  receiptHtml: string;
  qrCodeData?: string | null;
}

export interface BillDetailVm {
  billId: number;
  billNumber?: string | null;
  storeId: number;
  cashierUserId: number;
  status: string;
  grossAmount: number;
  discountAmount: number;
  taxAmount: number;
  roundOff: number;
  netAmount: number;
  items: Array<{
    billItemId: number;
    productId: number;
    productName: string;
    sku: string;
    unitPrice: number;
    qty: number;
    discount: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  payments: PaymentVm[];
}

export interface HeldBillVm {
  billId: number;
  customerMobile?: string | null;
  netAmount: number;
  heldAt: string;
}

export interface ReturnInitRequest {
  originalBillId: number;
  items: Array<{
    billItemId: number;
    returnQty: number;
    condition: string;
  }>;
  reason: string;
  refundMode: string;
}

export interface ReturnSummaryVm {
  returnId: number;
  originalBillId: number;
  status: string;
  refundAmount: number;
}

@Injectable({ providedIn: "root" })
export class BillingService {
  constructor(private http: HttpClient) {}

  getBills(params: { from?: string; to?: string; cashierUserId?: number; status?: string; page?: number; pageSize?: number }): Observable<{ items: BillSummaryVm[]; page: number; pageSize: number; totalCount: number }> {
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);
    if (params.cashierUserId) query.set("cashierUserId", String(params.cashierUserId));
    if (params.status) query.set("status", params.status);
    query.set("page", String(params.page ?? 1));
    query.set("pageSize", String(params.pageSize ?? 20));
    return this.http.get<{ items: BillSummaryVm[]; page: number; pageSize: number; totalCount: number }>(`/gateway/orders/bills?${query.toString()}`);
  }

  getBill(billId: number): Observable<BillDetailVm> {
    return this.http.get<BillDetailVm>(`/gateway/orders/bills/${billId}`);
  }

  getHeldBills(): Observable<HeldBillVm[]> {
    return this.http.get<HeldBillVm[]>("/gateway/orders/bills/held");
  }

  holdBill(billId: number, reason: string): Observable<unknown> {
    return this.http.post(`/gateway/orders/bills/${billId}/hold`, reason);
  }

  resumeBill(billId: number): Observable<BillDetailVm> {
    return this.http.put<BillDetailVm>(`/gateway/orders/bills/${billId}/resume`, {});
  }

  collectPayment(payload: CollectPaymentRequest): Observable<unknown> {
    return this.http.post("/gateway/orders/payments/collect", payload);
  }

  finalizeBill(billId: number): Observable<BillReceiptVm> {
    return this.http.post<BillReceiptVm>(`/gateway/orders/bills/${billId}/finalize`, {});
  }

  sendReceipt(billId: number): Observable<unknown> {
    return this.http.post(`/gateway/orders/bills/${billId}/send-receipt`, {});
  }

  initiateReturn(payload: ReturnInitRequest): Observable<ReturnSummaryVm> {
    return this.http.post<ReturnSummaryVm>("/gateway/orders/returns/initiate", payload);
  }

  approveReturn(returnId: number): Observable<ReturnSummaryVm> {
    return this.http.post<ReturnSummaryVm>(`/gateway/orders/returns/${returnId}/approve`, {});
  }

  refundReturn(returnId: number, refundMode: string): Observable<ReturnSummaryVm> {
    return this.http.post<ReturnSummaryVm>(`/gateway/orders/returns/${returnId}/refund`, { refundMode });
  }
}
