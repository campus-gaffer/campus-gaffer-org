-- Wire squad_players.squad_id → squads.id with ON DELETE CASCADE.
-- Without this, deleting a user leaves squads and squad_players orphaned, which is not what we want.
-- so this single constraint completes the full cascade chain:
--   users → squads → squad_players.

ALTER TABLE squad_players
    ADD CONSTRAINT squad_players_squad_id_fkey
    FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;
