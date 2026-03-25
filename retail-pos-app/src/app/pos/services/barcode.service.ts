import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({ providedIn: "root" })
export class BarcodeService {
  private buffer = "";
  private lastKeyTime = 0;
  private readonly scanTimeoutMs = 100;

  readonly scanned$ = new Subject<string>();

  handleKey(event: KeyboardEvent): void {
    const now = Date.now();
    if (now - this.lastKeyTime > this.scanTimeoutMs) {
      this.buffer = "";
    }
    this.lastKeyTime = now;

    if (event.key === "Enter" && this.buffer.length > 3) {
      this.scanned$.next(this.buffer.trim());
      this.buffer = "";
      return;
    }

    if (event.key.length === 1) {
      this.buffer += event.key;
    }
  }
}
