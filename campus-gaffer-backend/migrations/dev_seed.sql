-- dev_seed.sql — local/dev test data for PR #38, #39, #40 test plans.
-- NOT a numbered migration — never runs in prod.
--
-- Run from campus-gaffer-backend/:
--   psql $DATABASE_DEV_URL -f migrations/dev_seed.sql
--
-- Idempotent: ON CONFLICT DO NOTHING throughout. Safe to re-run.
--
-- Fixed IDs (copy these for browser localStorage setup — see bottom of file):
--   Squad UUID : 00000000-0000-0000-0003-000000000001
--   User ID    : user_dev_seed_1

BEGIN;

-- ─── Games: GW1-GW8, one per week ────────────────────────────────────────────
-- RegularGameweeks() groups by Mon-Sun week. GW8 kickoff is 2026-05-20 (Wed),
-- so its Sunday cutoff is 2026-05-24 23:59:59 — still in the future on 2026-05-22.
-- GET /gameweeks/current will therefore return { gameweek: 8, deadline: <Sun> }.

INSERT INTO games (
    id, external_game_id, external_source, external_game_type,
    external_league_id, home_team_external_id, away_team_external_id,
    kickoff_time, status
) VALUES
  ('00000000-0000-0000-0001-000000000001','seed-gw1','seed',0,'seed-league','KCS','TRN','2026-04-01 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000002','seed-gw2','seed',0,'seed-league','WAD','STJ','2026-04-08 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000003','seed-gw3','seed',0,'seed-league','PMB','MED','2026-04-15 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000004','seed-gw4','seed',0,'seed-league','ENG','LAW','2026-04-22 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000005','seed-gw5','seed',0,'seed-league','HIL','NTH','2026-04-29 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000006','seed-gw6','seed',0,'seed-league','KCS','WAD','2026-05-06 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000007','seed-gw7','seed',0,'seed-league','TRN','STJ','2026-05-13 18:00:00+00','Final'),
  ('00000000-0000-0000-0001-000000000008','seed-gw8','seed',0,'seed-league','PMB','KCS','2026-05-20 18:00:00+00','Scheduled')
ON CONFLICT (external_game_id, external_source) DO NOTHING;

-- ─── Players: 10 ─────────────────────────────────────────────────────────────

INSERT INTO players (id, external_player_id, external_source, name, is_private) VALUES
  ('00000000-0000-0000-0002-000000000001','sp-001','seed','Victor Nnah',      FALSE),
  ('00000000-0000-0000-0002-000000000002','sp-002','seed','Samuel Buchel',    FALSE),
  ('00000000-0000-0000-0002-000000000003','sp-003','seed','Silas Curpen',     FALSE),
  ('00000000-0000-0000-0002-000000000004','sp-004','seed','Chukwudi Chijioke',FALSE),
  ('00000000-0000-0000-0002-000000000005','sp-005','seed','Kendrick Costales',FALSE),
  ('00000000-0000-0000-0002-000000000006','sp-006','seed','Andre Effiok-Osu', FALSE),
  ('00000000-0000-0000-0002-000000000007','sp-007','seed','Godwin Osho',      FALSE),
  ('00000000-0000-0000-0002-000000000008','sp-008','seed','Ava Byrne',        FALSE),
  ('00000000-0000-0000-0002-000000000009','sp-009','seed','Sadie Glaston',    FALSE),
  ('00000000-0000-0000-0002-000000000010','sp-010','seed','Tomas G',          FALSE)
ON CONFLICT (external_player_id, external_source) DO NOTHING;

-- ─── Prices: GW1 (carry-forwards to GW8 via GetEffectivePrice) ───────────────

INSERT INTO player_prices (player_id, gameweek, price) VALUES
  ('00000000-0000-0000-0002-000000000001',1,8.0),
  ('00000000-0000-0000-0002-000000000002',1,7.5),
  ('00000000-0000-0000-0002-000000000003',1,7.0),
  ('00000000-0000-0000-0002-000000000004',1,6.5),
  ('00000000-0000-0000-0002-000000000005',1,6.0),
  ('00000000-0000-0000-0002-000000000006',1,5.5),
  ('00000000-0000-0000-0002-000000000007',1,5.0),
  ('00000000-0000-0000-0002-000000000008',1,5.0),
  ('00000000-0000-0000-0002-000000000009',1,4.5),
  ('00000000-0000-0000-0002-000000000010',1,4.5)
ON CONFLICT (player_id, gameweek) DO NOTHING;

-- ─── User ─────────────────────────────────────────────────────────────────────

INSERT INTO users (id, username, email) VALUES
  ('user_dev_seed_1','GafferDev','dev@campusgaffer.test')
ON CONFLICT (id) DO NOTHING;

-- ─── Squad (GW8, fixed UUID for localStorage test) ───────────────────────────

INSERT INTO squads (id, user_id, gameweek, budget_spent, locked_at) VALUES
  ('00000000-0000-0000-0003-000000000001','user_dev_seed_1',8,59.5,NOW())
ON CONFLICT DO NOTHING;

-- ─── Squad players: 6 starters + 4 bench ─────────────────────────────────────

INSERT INTO squad_players (squad_id, player_id, is_bench) VALUES
  -- starters
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000001',FALSE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000002',FALSE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000003',FALSE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000004',FALSE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000005',FALSE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000006',FALSE),
  -- bench
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000007',TRUE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000008',TRUE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000009',TRUE),
  ('00000000-0000-0000-0003-000000000001','00000000-0000-0000-0002-000000000010',TRUE)
ON CONFLICT (squad_id, player_id) DO NOTHING;

-- ─── Player game points (GW1 game, weight_ver 'v1.0') ────────────────────────
-- Breakdown: appearance=2, goal=4, win=2, draw=1, mvp=3
--   Victor Nnah      11  (2 + 4 + 2 + 3  goal + win + mvp)
--   Samuel Buchel     7  (2 + 4 + 1       goal + draw)
--   Silas Curpen      8  (2 + 4 + 2       goal + win)
--   Chukwudi Chijioke 4  (2 + 2           win)
--   Kendrick Costales 4  (2 + 2           win)
--   Andre Effiok-Osu  3  (2 + 1           draw)
--   ─────────────────────────────────────────────
--   Starters total   37  ← total_points in API response
--   ─────────────────────────────────────────────
--   Godwin Osho       8  (2 + 4 + 2       goal + win, bench — not counted)
--   Ava Byrne         2  (2               appearance only)
--   Sadie Glaston     4  (2 + 2           win)
--   Tomas G           0  (did not play)

INSERT INTO player_game_points (player_id, game_id, points, weight_ver) VALUES
  ('00000000-0000-0000-0002-000000000001','00000000-0000-0000-0001-000000000001',11,'v1.0'),
  ('00000000-0000-0000-0002-000000000002','00000000-0000-0000-0001-000000000001', 7,'v1.0'),
  ('00000000-0000-0000-0002-000000000003','00000000-0000-0000-0001-000000000001', 8,'v1.0'),
  ('00000000-0000-0000-0002-000000000004','00000000-0000-0000-0001-000000000001', 4,'v1.0'),
  ('00000000-0000-0000-0002-000000000005','00000000-0000-0000-0001-000000000001', 4,'v1.0'),
  ('00000000-0000-0000-0002-000000000006','00000000-0000-0000-0001-000000000001', 3,'v1.0'),
  ('00000000-0000-0000-0002-000000000007','00000000-0000-0000-0001-000000000001', 8,'v1.0'),
  ('00000000-0000-0000-0002-000000000008','00000000-0000-0000-0001-000000000001', 2,'v1.0'),
  ('00000000-0000-0000-0002-000000000009','00000000-0000-0000-0001-000000000001', 4,'v1.0'),
  ('00000000-0000-0000-0002-000000000010','00000000-0000-0000-0001-000000000001', 0,'v1.0')
ON CONFLICT (player_id, game_id, weight_ver) DO NOTHING;

COMMIT;

-- ─── PR #40 localStorage setup ───────────────────────────────────────────────
-- Paste into browser devtools console before opening GWBreakdownScreen:
--
-- localStorage.setItem('campus-gaffer-squad-id', '00000000-0000-0000-0003-000000000001');
-- localStorage.setItem('campus-gaffer-squad', JSON.stringify({
--   starters: [
--     { id: '00000000-0000-0000-0002-000000000001', name: 'Victor Nnah',       team: '', price: 8.0 },
--     { id: '00000000-0000-0000-0002-000000000002', name: 'Samuel Buchel',     team: '', price: 7.5 },
--     { id: '00000000-0000-0000-0002-000000000003', name: 'Silas Curpen',      team: '', price: 7.0 },
--     { id: '00000000-0000-0000-0002-000000000004', name: 'Chukwudi Chijioke', team: '', price: 6.5 },
--     { id: '00000000-0000-0000-0002-000000000005', name: 'Kendrick Costales', team: '', price: 6.0 },
--     { id: '00000000-0000-0000-0002-000000000006', name: 'Andre Effiok-Osu',  team: '', price: 5.5 }
--   ],
--   bench: [
--     { id: '00000000-0000-0000-0002-000000000007', name: 'Godwin Osho',    team: '', price: 5.0 },
--     { id: '00000000-0000-0000-0002-000000000008', name: 'Ava Byrne',      team: '', price: 5.0 },
--     { id: '00000000-0000-0000-0002-000000000009', name: 'Sadie Glaston',  team: '', price: 4.5 },
--     { id: '00000000-0000-0000-0002-000000000010', name: 'Tomas G',        team: '', price: 4.5 }
--   ]
-- }));
