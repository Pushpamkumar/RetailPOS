import { Component } from "@angular/core";
import { NotificationService } from "../services/notification.service";

@Component({
  selector: "app-toast-container",
  template: `
    <div class="toast-stack" *ngIf="notificationService.toasts$ | async as toasts">
      <button
        *ngFor="let toast of toasts"
        class="toast-card"
        [class.error]="toast.type === 'error'"
        [class.success]="toast.type === 'success'"
        [class.info]="toast.type === 'info'"
        type="button"
        (click)="notificationService.dismiss(toast.id)">
        <span class="toast-dot"></span>
        <span>{{ toast.message }}</span>
      </button>
    </div>
  `
})
export class ToastContainerComponent {
  constructor(public notificationService: NotificationService) {}
}
