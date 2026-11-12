CREATE TABLE platform_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    limit_students INTEGER NOT NULL CHECK (limit_students > 0),
    database_gb INTEGER NOT NULL CHECK (database_gb > 0),
    backup TEXT NOT NULL
);

CREATE TABLE platform_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    admin_name TEXT NOT NULL,
    admin_email TEXT NOT NULL,
    plan_id TEXT NOT NULL REFERENCES platform_plans(id),
    tracking_token_hash BYTEA NOT NULL UNIQUE CHECK (octet_length(tracking_token_hash) = 32),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL UNIQUE REFERENCES platform_requests(id),
    slug TEXT NOT NULL UNIQUE,
    region TEXT NOT NULL,
    environment TEXT NOT NULL CHECK (environment IN ('production', 'staging')),
    engine TEXT NOT NULL CHECK (engine IN ('terraform', 'opentofu', 'pulumi', 'cloudformation')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE platform_admin (
    id SMALLINT PRIMARY KEY CHECK (id = 1),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    credential_version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE platform_sessions (
    token_hash BYTEA PRIMARY KEY CHECK (octet_length(token_hash) = 32),
    admin_id SMALLINT NOT NULL REFERENCES platform_admin(id) ON DELETE CASCADE,
    credential_version INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX platform_sessions_expiration_idx ON platform_sessions (expires_at);
