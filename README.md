# Retail POS Billing & Store Management System

This repository follows the PRD, HLD, and LLD you provided:

- Angular SPA in [`retail-pos-app`](/c:/Users/pushp/OneDrive/Desktop/RetailPOS/retail-pos-app)
- Ocelot gateway in [`src/Gateway/RetailPOS.Gateway`](/c:/Users/pushp/OneDrive/Desktop/RetailPOS/src/Gateway/RetailPOS.Gateway)
- Four microservices in [`src/Services`](/c:/Users/pushp/OneDrive/Desktop/RetailPOS/src/Services)
- Shared contracts and middleware in [`src/Shared/RetailPOS.Shared`](/c:/Users/pushp/OneDrive/Desktop/RetailPOS/src/Shared/RetailPOS.Shared)
- NUnit test projects in [`tests`](/c:/Users/pushp/OneDrive/Desktop/RetailPOS/tests)

## Current Scope

The repo currently includes:

- Gateway routing, JWT validation, and correlation ID middleware
- Auth service with users, roles, stores, refresh tokens, and shifts
- Catalog service with product, category, tax, promotion, and price history foundations
- Billing service with bill aggregate, payments, finalization, returns, and receipt generation
- Admin service with inventory reservation/deduction, low-stock alerts, and dashboard/report stubs
- Angular app shell with login, billing, and dashboard starter screens

## Database Work You Should Run Locally

You said you want to handle database tasks yourself, so here are the exact steps:

1. Create four SQL Server databases in SQL Server 2022 / SSMS:
   - `POS_AuthDB`
   - `POS_CatalogDB`
   - `POS_BillingDB`
   - `POS_AdminDB`
2. Generate RSA keys and place them in each service/gateway `keys/` folder:
   - `private.pem` only in Auth service
   - `public.pem` in gateway and all services
3. Restore NuGet packages:
   - `dotnet restore RetailPOS.slnx`
4. Create EF Core migrations per service:
   - `dotnet ef migrations add InitialAuthSchema --project src/Services/RetailPOS.AuthService`
   - `dotnet ef migrations add InitialCatalogSchema --project src/Services/RetailPOS.CatalogService`
   - `dotnet ef migrations add InitialBillingSchema --project src/Services/RetailPOS.BillingService`
   - `dotnet ef migrations add InitialAdminSchema --project src/Services/RetailPOS.AdminService`
5. Apply them:
   - `dotnet ef database update --project src/Services/RetailPOS.AuthService`
   - `dotnet ef database update --project src/Services/RetailPOS.CatalogService`
   - `dotnet ef database update --project src/Services/RetailPOS.BillingService`
   - `dotnet ef database update --project src/Services/RetailPOS.AdminService`

## Run Order

Start these in separate terminals:

1. `dotnet run --project src/Services/RetailPOS.AuthService`
2. `dotnet run --project src/Services/RetailPOS.CatalogService`
3. `dotnet run --project src/Services/RetailPOS.BillingService`
4. `dotnet run --project src/Services/RetailPOS.AdminService`
5. `dotnet run --project src/Gateway/RetailPOS.Gateway`
6. In the frontend: `npm install` then `npm start`

## Important Notes

- The machine here has `.NET 10 SDK`, so the solution is scaffolded on `net10.0` even though the design targets .NET 8. If you want, I can do a cleanup pass next to downgrade every project to `net8.0` after you confirm the .NET 8 SDK is installed on your PC.
- Some report and dashboard endpoints are intentionally lightweight placeholders right now. The service boundaries and contracts are in place, and we can deepen each module in the next iteration.
