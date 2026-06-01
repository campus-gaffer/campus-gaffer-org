-- Add `username_customized` flag so the frontend can distinguish a user who
-- has explicitly chosen their display name from one still on the auto-derived
-- default minted by the auth middleware (e.g. "Manager-abc123").
--
-- HomeScreen reads this to surface a one-shot "set your display name" CTA
-- (notifications bell). The flag is flipped to true by PATCH /users/me when
-- the username repository write succeeds; once true it never flips back.
ALTER TABLE users
    ADD COLUMN username_customized BOOLEAN NOT NULL DEFAULT false;
