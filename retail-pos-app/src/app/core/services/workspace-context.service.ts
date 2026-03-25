import { Injectable } from "@angular/core";

const STORE_CODE_KEY = "pos_store_code";
const TERMINAL_CODE_KEY = "pos_terminal_code";

@Injectable({ providedIn: "root" })
export class WorkspaceContextService {
  getStoreCode(): string {
    return localStorage.getItem(STORE_CODE_KEY) ?? "";
  }

  setStoreCode(storeCode: string): void {
    localStorage.setItem(STORE_CODE_KEY, storeCode.trim());
  }

  getTerminalCode(): string {
    return localStorage.getItem(TERMINAL_CODE_KEY) ?? "";
  }

  setTerminalCode(terminalCode: string): void {
    localStorage.setItem(TERMINAL_CODE_KEY, terminalCode.trim());
  }

  clear(): void {
    localStorage.removeItem(STORE_CODE_KEY);
    localStorage.removeItem(TERMINAL_CODE_KEY);
  }
}
