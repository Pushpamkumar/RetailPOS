import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface ToastMessage {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

@Injectable({ providedIn: "root" })
export class NotificationService {
  private readonly toastsSubject = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  private seed = 0;

  success(message: string): void {
    this.push("success", message);
  }

  error(message: string): void {
    this.push("error", message);
  }

  info(message: string): void {
    this.push("info", message);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  private push(type: ToastMessage["type"], message: string): void {
    const toast: ToastMessage = {
      id: ++this.seed,
      type,
      message
    };

    this.toastsSubject.next([...this.toastsSubject.value, toast]);
    window.setTimeout(() => this.dismiss(toast.id), 4200);
  }
}
