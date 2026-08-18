-- Linking application accounts to the identity provider.
--
-- Passwords are not stored here. Supabase Auth owns credentials, email
-- verification and reset; this table owns what the application needs to make
-- decisions — the person's role and which plants they may see.
--
-- Two stores rather than one is deliberate. Roles and plant scope are business
-- facts that belong with the business data, and putting them in the identity
-- provider's metadata would make them editable from a place the application
-- does not control.

-- The Supabase auth.users id. Null for an account an administrator created
-- before the person has signed up: they exist, with a role, and cannot sign in
-- until their identity is linked.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS auth_id uuid UNIQUE;

-- password_hash is now dead. Dropping it rather than leaving it empty: a
-- nullable password column on a table that never stores passwords is an
-- invitation for somebody to start using it.
ALTER TABLE app_users DROP COLUMN IF EXISTS password_hash;

CREATE INDEX IF NOT EXISTS app_users_auth ON app_users (auth_id)
    WHERE auth_id IS NOT NULL;

-- ── First administrator ──────────────────────────────────────────────────
--
-- Signing up must not grant access. A new account gets the lowest role and no
-- plants, and an administrator raises it — otherwise anyone who can reach the
-- sign-up page can read the fleet.
--
-- The first account is the exception, because somebody has to be able to
-- promote the second. Seeded by email so it takes effect whenever that person
-- signs up, and only if no administrator exists yet.

CREATE OR REPLACE FUNCTION claim_first_admin(p_auth_id uuid, p_email text,
                                             p_name text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
    v_role text;
    v_have_admin boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM app_users
                    WHERE role = 'admin' AND auth_id IS NOT NULL)
      INTO v_have_admin;

    -- An administrator may pre-create the account; then this only links it.
    UPDATE app_users
       SET auth_id = p_auth_id,
           name    = COALESCE(NULLIF(p_name, ''), name)
     WHERE lower(email) = lower(p_email) AND auth_id IS NULL
    RETURNING role INTO v_role;

    IF v_role IS NOT NULL THEN
        RETURN v_role;
    END IF;

    v_role := CASE WHEN v_have_admin THEN 'viewer' ELSE 'admin' END;

    INSERT INTO app_users (auth_id, email, name, role, status, plant_codes)
    VALUES (p_auth_id, lower(p_email),
            COALESCE(NULLIF(p_name, ''), split_part(p_email, '@', 1)),
            v_role, 'active', '{}')
    ON CONFLICT (email) DO UPDATE SET auth_id = EXCLUDED.auth_id
    RETURNING role INTO v_role;

    RETURN v_role;
END $$;
