## Core Technical Documents

| Document | Purpose |
|---|---|
| **Database Schema** | ERD + table definitions, column types, constraints, foreign keys, PostGIS geometry columns, indexes. Derived from your migrations. |
| **Component Catalog** | Inventory of all React components (`ProductCard`, `OrderCard`, `ProductForm`, etc.), their props, and where they're used. |
| **Design System / Style Guide** | Color tokens, typography, spacing scale, button/form variants. You have a custom CSS variable system (`--fresh-primary-hover`, etc.) worth documenting. |
| **Algorithm Documentation** | Explains the freshness scoring + geospatial ranking logic in chenda-algo — inputs, weights, output format, and how the backend integrates it. |

## Process / Quality Documents

| Document | Purpose |
|---|---|
| **Test Plan** | Overview of all test types (unit, integration, E2E), what is covered, tools used (Jest, Playwright), and pass criteria. |
| **Security Documentation** | Auth flow (session cookies), route protection rules, input validation, rate limiting, CORS policy — especially relevant since Task 3.4 was "security hardening." |
| **Environment & Configuration Guide** | All .env variables for both server and chenda-frontend, what each does, and which are required vs. optional. |

## User-Facing Documents

| Document | Purpose |
|---|---|
| **User Stories / Requirements** | Formal list of what buyers, sellers, and admins can do. Useful for tracing features back to requirements. |
| **Changelog / Release Notes** | Summarizes what changed per sprint/phase — you have the git history but a human-readable version is useful for stakeholders. |

---

**Highest priority to create**, given your current state:
1. **Database Schema** — missing and highly referenced
2. **Algorithm Documentation** — the core differentiator of this project, least documented
3. **Environment & Configuration Guide** — critical for onboarding/deployment
4. **Test Plan** — you have E2E specs and Jest tests but no overview document