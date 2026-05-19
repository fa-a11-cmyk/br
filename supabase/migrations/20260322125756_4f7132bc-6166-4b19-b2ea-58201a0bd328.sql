
-- Add quota check in transcribe-audio via a comment marker
-- This is a no-op migration; the actual check is done in the edge function code
-- We're just ensuring the check_meeting_quota function exists (created in previous migration)
SELECT 1;
