CREATE TABLE download_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    submission_id TEXT,
    file_id TEXT,
    file_name TEXT,
    downloaded_by TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    send_to TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
