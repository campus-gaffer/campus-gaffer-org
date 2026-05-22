-- Reverses migration 002: restores users.id to BIGSERIAL and squads.user_id to BIGINT.
-- Data in users and squads is still lost (same as the up migration).

BEGIN;

TRUNCATE TABLE squad_players;
TRUNCATE TABLE squads;
TRUNCATE TABLE users;

-- Restore users to BIGSERIAL primary key
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_username;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_email;
ALTER TABLE users DROP COLUMN id;

ALTER TABLE users ADD COLUMN id BIGSERIAL PRIMARY KEY;
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMPTZ;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT uni_users_username UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT uni_users_email    UNIQUE (email);

-- Restore squads.user_id to BIGINT
DROP INDEX IF EXISTS idx_squads_user_id;
ALTER TABLE squads DROP COLUMN user_id;
ALTER TABLE squads ADD COLUMN user_id BIGINT NOT NULL DEFAULT 0;
ALTER TABLE squads ALTER COLUMN user_id DROP DEFAULT;
CREATE INDEX idx_squads_user_id ON squads (user_id);

COMMIT;
