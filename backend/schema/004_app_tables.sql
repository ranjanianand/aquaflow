-- Tables this application owns.
--
-- Distinct from everything above, which describes the plant and arrives from
-- the client. Nobody is going to send us a list of our own users or write our
-- knowledge base for us — these are ours to create, and their absence was a
-- gap in the build rather than something to wait for.

-- ── Users ───────────────────────────────────────────────────────────────
-- Authentication is currently a hardcoded credential pair in the frontend.
-- This table is the first half of replacing it: real accounts, real roles.
-- The second half is verifying a password against password_hash rather than a
-- string literal in auth-context.tsx.
--
-- No password column, only a hash. Storing a recoverable password is a choice
-- that cannot be walked back once accounts exist.
CREATE TABLE IF NOT EXISTS app_users (
    user_id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email         text NOT NULL UNIQUE,
    name          text NOT NULL,
    role          text NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('admin', 'manager', 'operator', 'viewer')),
    status        text NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive')),
    -- Null until real authentication lands. A row with no hash cannot sign in,
    -- which is the correct default for an account created by an administrator.
    password_hash text,
    -- Which plants this user may see. Empty means all — a fleet manager rather
    -- than a site operator.
    plant_codes   text[] NOT NULL DEFAULT '{}',
    last_login    timestamptz,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS app_users_email ON app_users (lower(email));

-- ── Knowledge base ──────────────────────────────────────────────────────
-- Procedures, troubleshooting notes, standard operating instructions. Content
-- the client writes and we store; the fixture that stood here contained
-- articles nobody had authored.
CREATE TABLE IF NOT EXISTS kb_articles (
    article_id  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title       text NOT NULL,
    category    text NOT NULL DEFAULT 'general',
    body        text NOT NULL,
    tags        text[] NOT NULL DEFAULT '{}',
    -- Which plant this applies to. Null means it applies to all of them.
    plant_code  text REFERENCES plants,
    author      text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS kb_articles_search
    ON kb_articles USING gin (to_tsvector('english', title || ' ' || body));

-- Seed the one account that exists today, so the screen shows the real user
-- rather than an empty table. Everything else is created through the app.
INSERT INTO app_users (email, name, role, status)
VALUES ('admin@yozytech.com', 'Admin User', 'admin', 'active')
ON CONFLICT (email) DO NOTHING;
