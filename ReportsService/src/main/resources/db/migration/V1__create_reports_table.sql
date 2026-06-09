CREATE TABLE reports (
    id                  UUID        PRIMARY KEY,
    title               VARCHAR(180) NOT NULL,
    description         TEXT         NOT NULL,
    category            VARCHAR(50)  NOT NULL,
    status              VARCHAR(50)  NOT NULL DEFAULT 'submitted',
    classified_category VARCHAR(50),
    status_reason       VARCHAR(500),
    reporter_user_id    UUID         NOT NULL,
    lat                 DOUBLE PRECISION NOT NULL,
    lon                 DOUBLE PRECISION NOT NULL,
    attachments         TEXT,
    created_at          TIMESTAMPTZ  NOT NULL,
    updated_at          TIMESTAMPTZ
);

CREATE INDEX idx_reports_status     ON reports (status);
CREATE INDEX idx_reports_created_at ON reports (created_at DESC);
CREATE INDEX idx_reports_reporter   ON reports (reporter_user_id);
