import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, map, tap } from "rxjs";

export interface LoginRequest {
  username: string;
  password: string;
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

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly TOKEN_KEY = "pos_access_token";
  private readonly REFRESH_KEY = "pos_refresh_token";
  private readonly ROLE_KEY = "pos_role";
  private readonly STORE_KEY = "pos_store_id";

  currentUser$ = new BehaviorSubject<UserState | null>(null);

  constructor(private http: HttpClient, private router: Router) {}

  login(dto: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>("/gateway/auth/login", dto).pipe(
      tap((res) => {
        localStorage.setItem(this.TOKEN_KEY, res.accessToken);
        localStorage.setItem(this.REFRESH_KEY, res.refreshToken);
        localStorage.setItem(this.ROLE_KEY, res.role);
        localStorage.setItem(this.STORE_KEY, String(res.storeId));
        this.currentUser$.next({
          userId: res.userId,
          role: res.role,
          fullName: res.fullName,
          storeId: res.storeId
        });
      }),
      map(() => void 0)
    );
  }

  logout(): void {
    localStorage.clear();
    this.currentUser$.next(null);
    this.router.navigate(["/auth/login"]);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  getStoreId(): number {
    return Number(localStorage.getItem(this.STORE_KEY) ?? "0");
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  refreshToken(): Observable<string> {
    const refreshToken = localStorage.getItem(this.REFRESH_KEY);
    return this.http.post<{ accessToken: string }>("/gateway/auth/refresh", { refreshToken }).pipe(
      tap((res) => localStorage.setItem(this.TOKEN_KEY, res.accessToken)),
      map((res) => res.accessToken)
    );
  }
}
