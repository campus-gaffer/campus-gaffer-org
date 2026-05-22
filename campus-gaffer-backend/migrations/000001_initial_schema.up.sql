-- Initial schema snapshot.
-- Uses IF NOT EXISTS so this is safe to apply against an already-populated DB.
-- Purpose: gives fresh environments a complete starting point.

CREATE TABLE IF NOT EXISTS users (
    id         BIGSERIAL    PRIMARY KEY,
    username   TEXT         NOT NULL,
    email      TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uni_users_username UNIQUE (username),
    CONSTRAINT uni_users_email    UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS teams (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT        NOT NULL,
    external_team_id  TEXT        NOT NULL,
    external_source   TEXT        NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uni_team_external UNIQUE (external_team_id, external_source)
);

CREATE TABLE IF NOT EXISTS players (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    external_player_id TEXT        NOT NULL,
    external_source    TEXT        NOT NULL,
    name               TEXT        NOT NULL,
    birth_date         DATE,
    is_private         BOOLEAN     NOT NULL DEFAULT FALSE,
    gender             TEXT,
    year_of_study      TEXT,
    graduation_year    TEXT,
    CONSTRAINT uni_player_external UNIQUE (external_player_id, external_source)
);

CREATE TABLE IF NOT EXISTS games (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    external_game_id      TEXT        NOT NULL,
    external_source       TEXT        NOT NULL,
    external_game_type    SMALLINT    NOT NULL DEFAULT 0,
    external_league_id    TEXT        NOT NULL DEFAULT '',
    home_team_external_id TEXT,
    away_team_external_id TEXT,
    kickoff_time          TIMESTAMPTZ,
    status                TEXT        NOT NULL DEFAULT 'Scheduled',
    is_scraped            BOOLEAN     NOT NULL DEFAULT FALSE,
    forfeited_by          TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uni_game_external UNIQUE (external_game_id, external_source)
);

CREATE TABLE IF NOT EXISTS player_performances (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id   UUID        NOT NULL REFERENCES players(id),
    game_id     UUID        NOT NULL REFERENCES games(id),
    goals       INTEGER     NOT NULL DEFAULT 0,
    assists     INTEGER     NOT NULL DEFAULT 0,
    yellow_card BOOLEAN     NOT NULL DEFAULT FALSE,
    red_card    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_prices (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id  UUID        NOT NULL REFERENCES players(id),
    gameweek   INTEGER     NOT NULL,
    price      FLOAT       NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uni_player_price_grain UNIQUE (player_id, gameweek)
);

CREATE TABLE IF NOT EXISTS player_game_points (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id  UUID        NOT NULL REFERENCES players(id),
    game_id    UUID        NOT NULL REFERENCES games(id),
    points     INTEGER     NOT NULL,
    weight_ver TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uni_game_points_grain UNIQUE (player_id, game_id, weight_ver)
);

CREATE TABLE IF NOT EXISTS squads (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      BIGINT      NOT NULL,
    gameweek     INTEGER     NOT NULL,
    budget_spent FLOAT       NOT NULL,
    locked_at    TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_squads_user_id ON squads (user_id);

CREATE TABLE IF NOT EXISTS squad_players (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id   UUID        NOT NULL REFERENCES squads(id) ON DELETE CASCADE,
    player_id  UUID        NOT NULL REFERENCES players(id),
    is_bench   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uni_squad_player_grain UNIQUE (squad_id, player_id)
);
