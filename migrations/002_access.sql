CREATE TABLE app_users (
 id text PRIMARY KEY,
 email text UNIQUE NOT NULL CHECK (email=lower(email) AND length(email)<=254),
 display_name text NOT NULL CHECK(length(display_name) BETWEEN 2 AND 100),
 password_hash text NOT NULL,
 role text NOT NULL CHECK(role IN ('ADMIN','REVIEWER')),
 disabled boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
 token_hash text PRIMARY KEY,
 user_id text NOT NULL REFERENCES app_users(id),
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE parcel_access (
 user_id text NOT NULL REFERENCES app_users(id),
 parcel_id text NOT NULL REFERENCES parcels(id),
 PRIMARY KEY(user_id,parcel_id)
);
CREATE TABLE rate_limits (key text PRIMARY KEY, hits integer NOT NULL CHECK(hits>0), expires_at timestamptz NOT NULL);
ALTER TABLE audit_log ADD COLUMN parcel_id text REFERENCES parcels(id);
ALTER TABLE review_cases ADD COLUMN version integer NOT NULL DEFAULT 1;
ALTER TABLE review_cases ADD CONSTRAINT review_status CHECK(status IN ('NEW','UNDER_REVIEW','NEEDS_EVIDENCE','RESOLVED','ESCALATED'));
ALTER TABLE baselines ADD CONSTRAINT baseline_party FOREIGN KEY(parcel_id,party) REFERENCES parties(parcel_id,id);
ALTER TABLE holdings ADD CONSTRAINT holding_party FOREIGN KEY(parcel_id,party) REFERENCES parties(parcel_id,id);
ALTER TABLE baselines ADD CONSTRAINT baseline_fraction CHECK(share ~ '^[0-9]{1,40}(/[1-9][0-9]{0,39})?$');
ALTER TABLE holdings ADD CONSTRAINT holding_fraction CHECK(share ~ '^[0-9]{1,40}(/[1-9][0-9]{0,39})?$');
CREATE INDEX runs_parcel_created ON runs(parcel_id,created_at DESC,id);
CREATE INDEX snapshots_parcel_created ON snapshots(parcel_id,created_at DESC,id);
CREATE INDEX audit_parcel_created ON audit_log(parcel_id,created_at DESC,id);
CREATE INDEX review_run ON review_cases(run_id);
-- Existing evidence and audit rows are retained. Old audit rows have no parcel
-- scope and remain visible only to administrators; new writes always set scope.
