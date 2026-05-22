-- Migrate users.id from BIGSERIAL to TEXT to hold Clerk user IDs (e.g. user_2xxx).
-- squads.user_id changes from BIGINT to TEXT to match.
--
-- Why: Clerk assigns string IDs. Using BIGINT requires a mapping table and
-- introduces a join that breaks the leaderboard query (uuid = bigint mismatch).
-- TEXT is simpler, a direct 1:1 with the Clerk-issued subject claim.
--
-- Data impact: squads and users are truncated. This is intentional — all
-- existing rows were created without real auth and are not worth preserving.
-- Game, player, and points data are untouched.

BEGIN;

-- 1. Clear dependent tables first (squad_players cascades from squads).
TRUNCATE TABLE squad_players;
TRUNCATE TABLE squads;
TRUNCATE TABLE users;

-- 2. Recreate users with a TEXT primary key.
--    Drop the old BIGSERIAL column; we cannot simply ALTER TYPE on a PK.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_username;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_email;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users DROP COLUMN IF EXISTS deleted_at; -- not needed with Clerk-managed identity

ALTER TABLE users ADD COLUMN id TEXT NOT NULL DEFAULT '';
UPDATE users SET id = 'placeholder_' || gen_random_uuid()::text; -- safety; table is empty
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE users ADD CONSTRAINT uni_users_username UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT uni_users_email    UNIQUE (email);
ALTER TABLE users ALTER COLUMN email DROP NOT NULL; -- Clerk may not expose email on all plans

-- 3. Fix squads.user_id: drop the BIGINT column and add TEXT.
ALTER TABLE squads DROP COLUMN user_id;
ALTER TABLE squads ADD COLUMN user_id TEXT NOT NULL DEFAULT '';
ALTER TABLE squads ALTER COLUMN user_id DROP DEFAULT;
-- Recreate the index (the old one was dropped with the column).
CREATE INDEX idx_squads_user_id ON squads (user_id);

COMMIT;
