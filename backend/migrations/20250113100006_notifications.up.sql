-- +migrate Up
-- Create notifications table

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL,
    user_id UUID,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_notifications_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_notifications_company_id ON notifications(company_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notifications_user_id ON notifications(user_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_deleted = FALSE;
CREATE INDEX idx_notifications_type ON notifications(type) WHERE is_deleted = FALSE;
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at DESC) WHERE is_deleted = FALSE;

-- Composite index for user's unread notifications (only if user_id is set)
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, sent_at DESC) WHERE is_deleted = FALSE AND is_read = FALSE AND user_id IS NOT NULL;

-- Index for company-wide notifications (user_id is NULL)
CREATE INDEX idx_notifications_company_unread ON notifications(company_id, is_read, sent_at DESC) WHERE is_deleted = FALSE AND is_read = FALSE AND user_id IS NULL;
