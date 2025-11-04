-- Fix mfa_recovery_hashes column size to accommodate all recovery code hashes
ALTER TABLE users MODIFY COLUMN mfa_recovery_hashes TEXT;
