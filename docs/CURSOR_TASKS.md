# Cursor Task Plan (Execute in order)

## 0) Install & Run
- Install pnpm. From repo root:
  - `pnpm -w i`
  - `docker-compose up -d db`
  - `pnpm -w dev`

## 1) Backend – Prisma & Endpoints
- Configure DATABASE_URL in `backend/.env` (copy from `.env.example`).
- `pnpm -w prisma:migrate` to create schema.
- Implement Prisma services for:
  - `GET/POST/PATCH /workcenters`
  - `GET /reports/daily`
  - `GET/POST /orders`
  - `GET/POST /schedule/board` (persist blocks & COs)
- Use `docs/API/openapi.yaml` for DTOs; create zod schemas to validate.

## 2) Frontend – Theme & Shell
- Verify glass theme loaded (cyan scrollbar, glow buttons, glass AppBar/Drawer).
- Wire `AppShell` navigation routes and role chip.

## 3) Settings – Add Lines
- Implement form POST → `/workcenters`; refresh list.
- Add Holidays editor (max 20) and local validation.
- Add Shift Scheme picker including **4×12**.

## 4) Schedule Summary
- Call `/reports/daily` with React Query; render **Line × Shift (Today)** by default.
- Add day/week/month toggles.

## 5) Orders
- Table with Performance Lever %, Color override; PATCH `/orders/:id`.

## 6) Board
- Use dnd‑kit. Render family A/B/C colors and red CO chips.
- Enforce **abutment** (CO between end(A) and start(B)) in FE logic and validate on save.
- Persist layout to `/schedule/board`.

## 7) Reports & Closeout
- Overall widget + Recharts; EMA velocity; OT toggle.
- Closeout save actuals, labor unavailable, top‑3 shortfalls.

## 8) Hardening
- JWT guard, Sentry, OTEL; Playwright smoke tests; k6 baseline.
