import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, map, tap } from "rxjs";

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginOptions {
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: string;
  userId: number;
  storeId: number;
  fullName: string;
}

export interface UserState {
  userId: number;
  role: string;
  fullName: string;
  storeId: number;
}

export interface StartShiftRequest {
  storeId: number;
  terminalId: string;
  openingCash: number;
}

export interface EndShiftRequest {
  shiftId: number;
  closingCash: number;
  notes?: string | null;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly TOKEN_KEY = "pos_access_token";
  private readonly REFRESH_KEY = "pos_refresh_token";
  private readonly ROLE_KEY = "pos_role";
  private readonly STORE_KEY = "pos_store_id";
  private readonly USER_KEY = "pos_user_id";
  private readonly FULL_NAME_KEY = "pos_full_name";
  private readonly SHIFT_KEY = "pos_shift_id";
  private readonly ATTEMPT_KEY = "pos_login_attempts";
  private readonly LOCKOUT_UNTIL_KEY = "pos_login_lockout_until";

  currentUser$ = new BehaviorSubject<UserState | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  login(dto: LoginRequest, options: LoginOptions = {}): Observable<LoginResponse> {
    return this.http.post<LoginResponse>("/gateway/auth/login", dto).pipe(
      tap((res) => {
        this.persistSession(res, !!options.rememberMe);
        this.resetLoginAttempts();
      }),
      map((res) => res)
    );
  }

  logout(options: { navigate?: boolean; preserveAttempts?: boolean } = {}): void {
    this.clearSessionStorage({ preserveAttempts: !!options.preserveAttempts });
    this.currentUser$.next(null);
    if (options.navigate !== false) {
      this.router.navigate(["/auth/login"]);
    }
  }

  getToken(): string | null {
    return this.readValue(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return this.readValue(this.ROLE_KEY);
  }

  getStoreId(): number {
    return Number(this.readValue(this.STORE_KEY) ?? "0");
  }

  getUserId(): number {
    return Number(this.readValue(this.USER_KEY) ?? "0");
  }

  getFullName(): string {
    return this.readValue(this.FULL_NAME_KEY) ?? "";
  }

  getShiftId(): number | null {
    const value = this.readValue(this.SHIFT_KEY);
    const shiftId = Number(value ?? "0");
    return shiftId > 0 ? shiftId : null;
  }

  setShiftId(shiftId: number): void {
    const storage = this.getActiveStorage();
    if (!storage) {
      return;
    }
    storage.setItem(this.SHIFT_KEY, String(shiftId));
  }

  clearShiftId(): void {
    localStorage.removeItem(this.SHIFT_KEY);
    sessionStorage.removeItem(this.SHIFT_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  refreshToken(): Observable<string> {
    const refreshToken = this.readValue(this.REFRESH_KEY);
    return this.http.post<{ accessToken: string }>("/gateway/auth/refresh", { refreshToken }).pipe(
      tap((res) => {
        const storage = this.getActiveStorage() ?? localStorage;
        storage.setItem(this.TOKEN_KEY, res.accessToken);
      }),
      map((res) => res.accessToken)
    );
  }

  startShift(dto: StartShiftRequest): Observable<{ shiftId: number }> {
    return this.http.post<{ shiftId: number }>("/gateway/auth/start-shift", dto).pipe(
      tap((res) => this.setShiftId(res.shiftId))
    );
  }

  endShift(dto: EndShiftRequest): Observable<{ shiftId: number }> {
    return this.http.post<{ shiftId: number }>("/gateway/auth/end-shift", dto).pipe(
      tap(() => this.clearShiftId())
    );
  }

  getLandingRoute(role: string | null = this.getRole()): string {
    switch (role) {
      case "Cashier":
        return "/pos/billing";
      case "InventoryClerk":
        return "/admin/inventory";
      case "StoreManager":
      case "RegionalManager":
      case "Admin":
        return "/admin/dashboard";
      default:
        return "/auth/login";
    }
  }

  getLoginAttempts(): number {
    return Number(localStorage.getItem(this.ATTEMPT_KEY) ?? "0");
  }

  recordLoginAttempt(): number {
    const attempts = this.getLoginAttempts() + 1;
    localStorage.setItem(this.ATTEMPT_KEY, String(attempts));
    return attempts;
  }

  resetLoginAttempts(): void {
    localStorage.removeItem(this.ATTEMPT_KEY);
    localStorage.removeItem(this.LOCKOUT_UNTIL_KEY);
  }

  setLoginLockout(durationMs = 60000): void {
    localStorage.setItem(this.LOCKOUT_UNTIL_KEY, String(Date.now() + durationMs));
  }

  getLoginLockoutRemainingSeconds(): number {
    const until = Number(localStorage.getItem(this.LOCKOUT_UNTIL_KEY) ?? "0");
    if (!until) {
      return 0;
    }

    const remaining = Math.ceil((until - Date.now()) / 1000);
    if (remaining <= 0) {
      this.resetLoginAttempts();
      return 0;
    }
    return remaining;
  }

  isLoginLocked(): boolean {
    return this.getLoginLockoutRemainingSeconds() > 0;
  }

  private restoreSession(): void {
    const storage = this.getActiveStorage();
    if (!storage) {
      return;
    }

    const userId = Number(storage.getItem(this.USER_KEY) ?? "0");
    const role = storage.getItem(this.ROLE_KEY);
    const fullName = storage.getItem(this.FULL_NAME_KEY);
    const storeId = Number(storage.getItem(this.STORE_KEY) ?? "0");

    if (userId && role && fullName && storeId) {
      this.currentUser$.next({ userId, role, fullName, storeId });
    }
  }

  private persistSession(res: LoginResponse, rememberMe: boolean): void {
    const activeStorage = rememberMe ? localStorage : sessionStorage;
    const inactiveStorage = rememberMe ? sessionStorage : localStorage;
    this.clearKnownKeys(inactiveStorage);

    activeStorage.setItem(this.TOKEN_KEY, res.accessToken);
    activeStorage.setItem(this.REFRESH_KEY, res.refreshToken);
    activeStorage.setItem(this.ROLE_KEY, res.role);
    activeStorage.setItem(this.STORE_KEY, String(res.storeId));
    activeStorage.setItem(this.USER_KEY, String(res.userId));
    activeStorage.setItem(this.FULL_NAME_KEY, res.fullName);

    this.currentUser$.next({
      userId: res.userId,
      role: res.role,
      fullName: res.fullName,
      storeId: res.storeId
    });
  }

  private readValue(key: string): string | null {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  }

  private getActiveStorage(): Storage | null {
    if (localStorage.getItem(this.TOKEN_KEY) || localStorage.getItem(this.REFRESH_KEY)) {
      return localStorage;
    }
    if (sessionStorage.getItem(this.TOKEN_KEY) || sessionStorage.getItem(this.REFRESH_KEY)) {
      return sessionStorage;
    }
    return null;
  }

  private clearSessionStorage(options: { preserveAttempts?: boolean } = {}): void {
    this.clearKnownKeys(localStorage, !!options.preserveAttempts);
    this.clearKnownKeys(sessionStorage, !!options.preserveAttempts);
    if (!options.preserveAttempts) {
      this.resetLoginAttempts();
    }
    this.clearShiftId();
  }

  private clearKnownKeys(storage: Storage, preserveAttempts = false): void {
    [this.TOKEN_KEY, this.REFRESH_KEY, this.ROLE_KEY, this.STORE_KEY, this.USER_KEY, this.FULL_NAME_KEY, this.SHIFT_KEY]
      .forEach((key) => storage.removeItem(key));
    if (!preserveAttempts) {
      storage.removeItem(this.ATTEMPT_KEY);
      storage.removeItem(this.LOCKOUT_UNTIL_KEY);
    }
  }
}
