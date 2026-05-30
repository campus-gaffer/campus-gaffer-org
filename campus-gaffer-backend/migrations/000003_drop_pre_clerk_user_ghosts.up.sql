-- Drop legacy pre-Clerk placeholder rows from `users` AND orphan squads,
-- then enforce referential integrity from `squads.user_id` → `users.id`.
--
-- Background: before Clerk auth landed, the frontend generated a random
-- UUID per device and POSTed it as `user_id`. Squad creation upserted a
-- placeholder users row keyed by that UUID. Post-Clerk, real users have
-- IDs of the form `user_<base62>` (Clerk session subject). Seed users
-- (cmd/seed) have IDs of the form `seed_user_NNNN`.
--
-- Anything else in `users.id` is a legacy ghost. Some squads also point
-- at user_ids that have no matching users row at all (orphans — likely
-- their user row was deleted manually during earlier debugging). Both
-- categories must go before the FK in step 4 can validate against the
-- live data.

BEGIN;

-- Real users = Clerk subjects + cmd/seed fixtures. The "NOT IN (real)"
-- predicate catches BOTH ghost-owned squads (user_id is a UUID that does
-- exist in users) AND orphan squads (user_id has no matching users row).

-- 1. squad_players for squads NOT owned by a real user.
DELETE FROM squad_players
 WHERE squad_id IN (
   SELECT id FROM squads
   WHERE user_id NOT IN (
     SELECT id FROM users
     WHERE id LIKE 'user_%' OR id LIKE 'seed_user_%'
   )
 );

-- 2. Squads NOT owned by a real user.
DELETE FROM squads
 WHERE user_id NOT IN (
   SELECT id FROM users
   WHERE id LIKE 'user_%' OR id LIKE 'seed_user_%'
 );

-- 3. Ghost users themselves.
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
