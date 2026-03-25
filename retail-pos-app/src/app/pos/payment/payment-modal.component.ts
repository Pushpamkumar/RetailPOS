import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "app-payment-modal",
  template: `
    <div class="panel">
      <h3>Payment</h3>
      <p>Amount: {{ amount }}</p>
      <button class="btn" (click)="paymentComplete.emit()">Confirm</button>
      <button class="btn secondary" (click)="paymentClosed.emit()">Close</button>
    </div>
  `
})
export class PaymentModalComponent {
  @Input() amount = 0;
  @Output() paymentClosed = new EventEmitter<void>();
  @Output() paymentComplete = new EventEmitter<void>();
}
