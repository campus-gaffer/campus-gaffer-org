-- Reverses the FK + leaves deleted ghost rows gone (they cannot be
-- restored). Use only if the FK constraint causes a regression and you
-- need to fall back to the previous schema state.

ALTER TABLE squads DROP CONSTRAINT IF EXISTS squads_user_id_fkey;
