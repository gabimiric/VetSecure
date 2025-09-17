-- V4: Add only the columns your entity has: decided_at (TIMESTAMP NULL) and decided_by (VARCHAR(120) NULL)
-- Dynamic/defensive style using INFORMATION_SCHEMA + PREPARE.

-- decided_at
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'decided_at'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN decided_at TIMESTAMP NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- decided_by
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinic_requests' AND COLUMN_NAME = 'decided_by'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE clinic_requests ADD COLUMN decided_by VARCHAR(120) NULL',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;