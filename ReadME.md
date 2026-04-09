# Marketplace

A multi-vendor e-commerce platform built with a team-mate (Fahad-76) as a side project. Features real-time stock updates, a complete order state machine, and a full CI/CD pipeline.

## Tech stack

**Backend:** C# .NET 10, ASP.NET Core Web API, Entity Framework Core, SignalR  
**Frontend:** Angular 17, TypeScript  
**Databases:** SQL Server (orders, users, inventory), MongoDB (product catalog)  
**Infrastructure:** Docker, Docker Compose, GitHub Actions, GitHub Container Registry  
**Auth:** JWT with role-based access (Buyer / Seller / Admin)

## Architecture
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   Angular SPA   │────▶│  ASP.NET API    │────▶│  SQL Server  │
│   (Port 4200)   │     │  (Port 5165)    │     │  (EF Core)   │
│                 │◀────│                 │     └──────────────┘
│  Buyer portal   │ WS  │  Controllers    │     ┌──────────────┐
│  Seller portal  │     │  Services       │────▶│   MongoDB    │
│  Admin portal   │     │  SignalR Hub    │     │  (Products)  │
└─────────────────┘     └─────────────────┘     └──────────────┘

## Running locally

**Prerequisites:** Docker Desktop, .NET 10 SDK, Node 22, Angular CLI
```bash
# Start databases
docker compose up sqlserver mongodb -d

# Start API (auto-runs migrations and seeds data)
cd MarketplaceAPI
dotnet run

# Start Angular
cd ../MarketplaceClient
ng serve --configuration development
```

Open `http://localhost:4200`

## Running with Docker
```bash
docker compose up --build
```

## CI/CD

Every push to `main` triggers:
1. Restore and build
2. Integration tests against real SQL Server and MongoDB containers
3. On pass — build and push Docker images to GitHub Container Registry

## Key features

- JWT authentication with three roles (Buyer, Seller, Admin)
- Product catalog with flexible attributes stored in MongoDB
- Cart system with price snapshotting at add-time
- Order state machine (Pending → Paid → Fulfilled → Cancelled)
- Optimistic concurrency for inventory — prevents overselling under concurrent load
- Real-time stock updates via SignalR WebSockets
- Low stock alerts pushed to seller dashboard live
- Admin portal with platform stats, user management, and order oversight
- Stock restored automatically on order cancellation
- Multi-stage Docker builds, health-checked Compose, GitHub Actions pipeline
