ALTER TABLE platform_tenants
    ADD COLUMN app_url TEXT UNIQUE,
    ADD COLUMN invitation_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (invitation_status IN ('pending', 'sent', 'failed', 'activated', 'preview')),
    ADD COLUMN invitation_updated_at TIMESTAMPTZ;
