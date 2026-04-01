# Campus Gaffer - Integration Fixes Changelog

## Overview
Comprehensive audit and fix of frontend ↔ backend ↔ Neon DB integration layer.

---

## Issue #1: PORT MISMATCH (CRITICAL) — FIXED
- Frontend called `localhost:8081`, backend listened on `:8082`
- **Fix:** Changed all frontend API base URLs from `8081` → `8082`
- **Files:** Dashboard.tsx, Transfers.tsx, Scores.tsx, Onboarding.tsx

## Issue #2: GetLiveMatch returned arbitrary match — FIXED
- `database.DB.First(&match)` ignored `is_live` flag
- **Fix:** Added `Where("is_live = ?", true)` filter

## Issue #3: Duplicate AutoMigrate — FIXED
- main.go had duplicate AutoMigrate lines
- **Fix:** Removed duplication, consolidated into single call

## Issue #4: Orphaned DB tables — PENDING
- `games`, `games_data`, `divisions`, `teams` exist in Neon but no GORM models/handlers
- **Decision needed:** Build handlers or drop tables

## Issue #5: Unused POST /users endpoint — PENDING
- `CreateUser` registered but never called by frontend
- **Decision:** Remove or wire up

## Issue #6: Onboarding response shape — PENDING
- Backend returns `{"status": "success"}`, frontend may expect user object
- **Note:** Frontend navigates to dashboard regardless; low priority

## Issue #7: Games FK constraints without models — PENDING
- `games.home_team_id → teams(id)`, etc. enforced at DB level but not GORM
- **Pending:** Build GORM models for teams/divisions or remove constraints

---

## Feature: Live Match View (Scores Page Redesign)

### Branch: `feature/live-match-view`

**Backend Changes:**
- New `MatchEvent` model (`internal/models/match.go`)
- New DB table `match_events` with FK to `matches`
- New endpoints:
  - `GET /matches` — all matches (live + upcoming)
  - `GET /matches/:id` — single match by ID
  - `GET /matches/:id/events` — events for a match
- AutoMigrate now includes `MatchEvent`

**Frontend Changes (Scores.tsx):**
- Added LIVE / UPCOMING tab switcher
- Clickable match cards that select and display match detail
- Full match center with score, stats, possession bar
- Match events timeline (goals, cards, substitutions)
- Mock events as fallback when no DB events exist
- Back navigation to dashboard

**DB Migration Applied:**
- Created `match_events` table with proper FK to `matches`
- Added `match_events` JSONB column to `matches` (for embedding)

**Pre-existing TS errors fixed:**
- Removed unused imports across all pages (Dashboard, Leagues, PlayerProfile, Rules, Transfers, Scores, About, NavBar, Pitch)
- Fixed `fallbackRedirectUrl` → `signInFallbackRedirectUrl` in ClerkProvider
- Fixed `setCaptain` type mismatch (string vs string | number)
- Fixed unused `idx` variable in Scores.tsx events map
- Removed unused `useNavigate`/`navigate` declarations

---

## Branches
- `fix/backend-frontend-integration` — port mismatch + AutoMigrate + GetLiveMatch fixes
- `feature/live-match-view` — Scores page redesign + match events backend
