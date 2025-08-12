# BUILD PLAN – Production (v1) • 2025-08-08

This plan is **implementation‑ready** in Cursor. It defines architecture, backlog,
sprints, acceptance criteria, QA gates, performance budgets, and deployment.

---

## 1) Architecture & Stack

**Frontend**: React + TS + Vite, **MUI v5 (+Emotion)**, **React Query**, **React Router**,
**Recharts** (charts), **dnd‑kit** (Board drag/drop).

**Backend**: Node + TS (**Fastify**) + **Prisma** (Postgres). DTO validation via **zod**.
OpenAPI first; code‑gen optional.

**Optimizer**: Python **FastAPI** + **OR‑Tools CP‑SAT** (container).

**Auth**: OIDC (Azure AD/Okta) → JWT. RBAC roles: **Admin, Planner, OM, Operator**.

**Observability**: Sentry, OpenTelemetry → Prometheus/Grafana.

**Exports**: server PDF (Puppeteer) + Excel (xlsxwriter).

**Infra**: Docker for dev; Helm/K8s for staging/prod; GH Actions CI/CD.

---

## 2) Scope (MVP)

1. **Schedule**
   - Summary (default): **Line × Shift (Today)**; Day/Week/Month toggles.
   - Board: lanes by line, **orders colored by family (A/B/C)**;
     **changeover chips** (A–J) in **red hues by complexity**;
     **abutment**: COs back‑to‑back with adjacent orders.

2. **Orders**
   - Grid with **Performance Lever %**, **per‑order Color override**, shop‑floor title.

3. **Resources**
   - **Shift pattern per workcenter** (up to **4 windows/day**, start/end + DoW).
   - **Competency matrix** (Operator/Mechanic level 1–3, trained? expiry).

4. **Changeovers & Events**
   - Types A–J; **include in OEE = Yes (default)**.
   - Extra events: **PMs, Trials, Training** (planned, excluded from OEE by default).

5. **Closeout**
   - Actual units, **Labor unavailable**, **Top‑3 shortfalls** with minutes;
     **Save & Re‑plan** to push/pull downstream (heuristic).

6. **Reports**
   - **Overall**: Units Planned, Units Produced, **% to Plan**, **OEE**, **Week Projection**,
     **On/At‑Risk/Off‑Track** with thresholds (98/95 default).
   - Per‑line table and exports (Excel/PDF).

7. **Settings**
   - **Add Lines** (workcenters), Department, ERP #, scheme.
   - **Holidays** (≤20 per year).
   - **4×12 scheme** (M‑W 07–19 & 19–07; Th‑Su 07–19 & 19–07).
   - **Overtime**: add Sat/Sun + adjust shift hours per line (date‑ranged overrides).

---

## 3) Sprints

**Sprint 1 (Week 1) – Foundations**
- FE Shell + Theme + Routing + Query client.
- BE scaffolding + Prisma migrations + seeds.
- Settings → **Add Lines** (CRUD + UI).

**Sprint 2 (Week 2) – Core Ops**
- Orders grid (lever %, color override) + API.
- Schedule Board: dnd‑kit, family colors, **CO chips** and **abutment**.
- Conflicts: skill level check for heavy/extreme COs (Mechanic L2+).

**Sprint 3 (Week 3) – Reports & Settings**
- **/reports/daily** + Recharts; Overall widget with projection & RAG.
- Holidays (≤20), shift patterns (≤4/day), OT toggles.

**Sprint 4 (Week 4) – Optimizer & Hardening**
- Optimizer microservice (CP‑SAT); objective: maximize units, minimize CO, tardiness.
- JWT guard, Sentry, OTEL traces; Playwright smoke; k6 baseline.

**Optional Sprint 5 – Manufacturing Coupling**
- Press/Bin/Batch gating and upstream readiness windows in the objective.

---

## 4) Acceptance Criteria (DoD)

- **Add Lines** persists; appears across Schedule/Orders/Resources/Reports.
- Board **enforces abutment** and displays **red CO tiers** (minutes → tier map).
- Orders **Color** override reflects immediately; **Lever %** recomputes durations.
- Closeout saves actuals + top‑3; triggers downstream repair.
- Reports show Overall metrics + RAG; OT toggles influence projection.
- Settings: add ≤20 holidays; 4×12 scheme; per‑WC OT windows.
- Security: RBAC on mutating endpoints; audit log schedule edits.
- Perf: Board render p95 < 120 ms for 20 lines × 150 blocks; FE bundle < 250 KB gz for shell.

---

## 5) QA & Performance Budgets

- Unit tests ≥ 80% for core; type coverage ≥ 90% (tsc).
- Playwright: Add Line, drag/drop + CO change, closeout, export.
- k6: /schedule/board p95 < 200 ms @ 50 rps (staging).
- Accessibility: WCAG AA (contrast tokens, focus visible).

---

## 6) Security

- OIDC SSO for prod; short‑lived JWTs (exp ≤ 60m).
- Input validation (zod/class‑validator), CORS allowlist, CSP/HSTS headers.
- Secrets via Vault/KMS; no secrets in source.
- Audit log: who/when/what for schedule & settings changes.

---

## 7) Deploy

- **Local**: `docker-compose up -d db && pnpm -w dev`
- **Staging/Prod**: Build Docker images + Helm charts; use managed Postgres; run migrations during deploy.

---

## 8) Handover to Cursor

Open **`docs/CURSOR_TASKS.md`** and follow step‑by‑step tasks that reference the OpenAPI and Prisma schema.
