import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable, catchError, filter, switchMap, take, throwError } from "rxjs";
import { AuthService } from "../services/auth.service";

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshSubject = new BehaviorSubject<string | null>(null);

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = this.authService.getToken();
    const authReq = token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

    return next.handle(authReq).pipe(
      catchError((err: unknown) => {
        if (err instanceof HttpErrorResponse && err.status === 401 && !req.url.includes("refresh")) {
          return this.handle401(req, next);
        }
        return throwError(() => err);
      })
    );
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshSubject.next(null);
      return this.authService.refreshToken().pipe(
        switchMap((token) => {
          this.isRefreshing = false;
          this.refreshSubject.next(token);
          return next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
        }),
        catchError((error) => {
          this.authService.logout();
          return throwError(() => error);
        })
      );
    }

    return this.refreshSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) => next.handle(req.clone({ setHeaders: { Authorization: `Bearer ${token ?? ""}` } })))
    );
  }
}
