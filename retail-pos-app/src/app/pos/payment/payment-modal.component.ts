import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { FormBuilder, Validators } from "@angular/forms";

export interface PaymentSubmission {
  paymentMode: "CASH" | "CARD" | "UPI" | "WALLET";
  amount: number;
  referenceNo: string | null;
  cashReceived: number | null;
}

@Component({
  selector: "app-payment-modal",
  template: `
    <div class="modal-backdrop" *ngIf="visible">
      <div class="modal-panel">
        <div class="panel-header">
          <div>
            <h3>Collect Payment</h3>
            <p class="muted">Capture the payment mode, reference, and cash tendered before finalizing.</p>
          </div>
          <button class="btn secondary" type="button" (click)="paymentClosed.emit()">Close</button>
        </div>

        <form [formGroup]="form" (ngSubmit)="confirm()" class="grid form-grid">
          <div class="field">
            <label>Payment mode</label>
            <select formControlName="paymentMode" (change)="syncValidation()">
              <option value="CASH">Cash</option>
              <option value="CARD">Card</option>
              <option value="UPI">UPI</option>
              <option value="WALLET">Wallet</option>
            </select>
          </div>

          <div class="field">
            <label>Amount</label>
            <input type="number" formControlName="amount" min="0" step="0.01" />
          </div>

          <div class="field" *ngIf="requiresReference">
            <label>Reference number</label>
            <input formControlName="referenceNo" placeholder="Card / UPI reference" />
          </div>

          <div class="field" *ngIf="isCash">
            <label>Cash received</label>
            <input type="number" formControlName="cashReceived" min="0" step="0.01" />
          </div>

          <div class="summary-metric">
            <span>Change</span>
            <strong>{{ change | number:'1.2-2' }}</strong>
          </div>

          <div class="auth-links">
            <span class="muted">Net amount: {{ amount | number:'1.2-2' }}</span>
            <span class="muted">Only exact or higher payment is allowed.</span>
          </div>

          <button class="btn" type="submit">Confirm Payment</button>
        </form>
      </div>
    </div>
  `
})
export class PaymentModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() amount = 0;
  @Output() paymentClosed = new EventEmitter<void>();
  @Output() paymentComplete = new EventEmitter<PaymentSubmission>();

  readonly form;

  constructor(private formBuilder: FormBuilder) {
    this.form = this.formBuilder.nonNullable.group({
      paymentMode: ["CASH" as PaymentSubmission["paymentMode"], Validators.required],
      amount: [0, [Validators.required, Validators.min(0)]],
      referenceNo: [""],
      cashReceived: [0]
    });
  }

  get isCash(): boolean {
    return this.form.controls.paymentMode.value === "CASH";
  }

  get requiresReference(): boolean {
    return !this.isCash;
  }

  get change(): number {
    return Math.max((Number(this.form.controls.cashReceived.value ?? 0) - Number(this.form.controls.amount.value ?? 0)), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["amount"]) {
      this.form.patchValue({ amount: this.amount, cashReceived: this.amount });
    }
    if (changes["visible"] && this.visible) {
      this.syncValidation();
    }
  }

  syncValidation(): void {
    const reference = this.form.controls.referenceNo;
    const cashReceived = this.form.controls.cashReceived;
    if (this.isCash) {
      reference.clearValidators();
      cashReceived.setValidators([Validators.required, Validators.min(this.form.controls.amount.value ?? 0)]);
    } else {
      reference.setValidators([Validators.required, Validators.minLength(3)]);
      cashReceived.clearValidators();
    }
    reference.updateValueAndValidity();
    cashReceived.updateValueAndValidity();
  }

  confirm(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.paymentComplete.emit({
      paymentMode: value.paymentMode,
      amount: Number(value.amount),
      referenceNo: value.referenceNo?.trim() || null,
      cashReceived: value.cashReceived ? Number(value.cashReceived) : null
    });
  }
}
