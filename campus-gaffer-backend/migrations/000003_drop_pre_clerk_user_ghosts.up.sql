-- Drop legacy pre-Clerk placeholder rows from `users` and enforce
-- referential integrity from `squads.user_id` → `users.id` going forward.
--
-- Background: before Clerk auth landed, the frontend generated a random
-- UUID per device and POSTed it as `user_id`. Squad creation upserted a
-- placeholder users row keyed by that UUID. Post-Clerk, real users have
-- IDs of the form `user_<base62>` (Clerk session subject). Seed users
-- (cmd/seed) have IDs of the form `seed_user_NNNN`.
--
-- Anything else in `users.id` is a legacy ghost with no path back to a
-- real authenticated session — safe to drop.

BEGIN;

-- 1. Drop squad_players for squads owned by ghost users.
DELETE FROM squad_players
 WHERE squad_id IN (
   SELECT s.id
   FROM squads s
   JOIN users u ON u.id = s.user_id
   WHERE u.id NOT LIKE 'user_%'
     AND u.id NOT LIKE 'seed_user_%'
 );

-- 2. Drop squads owned by ghost users.
DELETE FROM squads
 WHERE user_id IN (
   SELECT id FROM users
   WHERE id NOT LIKE 'user_%'
     AND id NOT LIKE 'seed_user_%'
 );

-- 3. Drop the ghost users themselves.
DELETE FROM users
 WHERE id NOT LIKE 'user_%'
   AND id NOT LIKE 'seed_user_%';

-- 4. Enforce referential integrity going forward. CASCADE so that
--    deleting a user (e.g. via Clerk delete webhook in future) cleans up
--    their squad + squad_players automatically.
ALTER TABLE squads
  ADD CONSTRAINT squads_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

COMMIT;
