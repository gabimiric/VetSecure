-- V3: Make clinic_requests match ClinicRequest entity without failing
-- on older MySQL (no ADD COLUMN IF NOT EXISTS support).
-- We guard each change with INFORMATION_SCHEMA and dynamic SQL.

-- clinic_name VARCHAR(160) NOT NULL
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'clinic_name'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN clinic_name VARCHAR(160) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- address VARCHAR(255) NOT NULL
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'address'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN address VARCHAR(255) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- city VARCHAR(120) NULL
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'city'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN city VARCHAR(120) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- phone VARCHAR(40) NULL
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'phone'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN phone VARCHAR(40) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- admin_name VARCHAR(120) NOT NULL
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'admin_name'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN admin_name VARCHAR(120) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure admin_email VARCHAR(190) NOT NULL (only if column exists)
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'admin_email'
);
SET @sql := IF(@exists = 1,
  'ALTER TABLE clinic_requests MODIFY COLUMN admin_email VARCHAR(190) NOT NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on admin_email
SET @idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND INDEX_NAME = 'idx_clinic_requests_admin_email'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_clinic_requests_admin_email ON clinic_requests (admin_email)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Index on status (column created in V2)
SET @idx := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND INDEX_NAME = 'idx_clinic_requests_status'
);
SET @sql := IF(@idx = 0,
  'CREATE INDEX idx_clinic_requests_status ON clinic_requests (status)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;