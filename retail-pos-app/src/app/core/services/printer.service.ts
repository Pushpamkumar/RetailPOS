import { Injectable } from "@angular/core";

@Injectable({ providedIn: "root" })
export class PrinterService {
  printReceipt(html: string): void {
    const popup = window.open("", "_blank", "width=480,height=720");
    if (!popup) return;
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
  }
}
