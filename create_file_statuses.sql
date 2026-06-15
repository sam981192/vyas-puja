CREATE TABLE file_statuses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT,
    status TEXT DEFAULT 'Pending',
    send_to TEXT,
    updated_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    downloaded_by TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, file_name)
);
