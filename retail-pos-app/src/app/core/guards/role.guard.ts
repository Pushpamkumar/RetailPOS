import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

@Injectable({ providedIn: "root" })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const allowed = route.data["roles"] as string[] | undefined;
    const role = this.authService.getRole();
    if (!allowed || (role && allowed.includes(role))) {
      return true;
    }
    this.router.navigate([this.authService.getLandingRoute(role)]);
    return false;
  }
}
