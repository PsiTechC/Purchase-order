# PurchaseHub – Purchase Order Management System

## Stack
- Backend: Go (net/http + PostgreSQL, no heavy framework — fast startup)
- Frontend: React + Vite (responsive, works on desktop/tablet/mobile browsers)
- DB: PostgreSQL

## Logins
- Employee / Employee@123
- Admin / Admin$2026

## 1. Start PostgreSQL (Docker)
```bash
cd purchasehub
docker compose up -d
```
This creates DB `purchasehub` and runs schema.sql automatically.

(No Docker? Create DB manually and run: `psql -U postgres -d purchasehub -f schema.sql`)

## 2. Run Backend (Go)
```bash
cd backend go mod tidy
go run main.go
```
Backend runs on http://localhost:8080
(Optional) set custom DB url: `export DATABASE_URL="postgres://user:pass@host:5432/purchasehub?sslmode=disable"`

## 3. Run Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
Open http://localhost:5173

## Production build (frontend)
```bash
npm run build
```
Outputs static files to `frontend/dist` — serve with any static host/nginx.

## Notes
- Live sync: frontend polls every 3s so Employees see Admin's status/tracking updates automatically.
- Mobile/Tablet: layout is fully responsive (CSS grid + flexbox breakpoints).
- For a native mobile app (React Native), the same `/api` endpoints can be reused — point fetch calls to your backend's public URL.
