-- Increase column sizes to accommodate encrypted data
-- Use conditional logic to handle existing/missing columns (similar to V3 pattern)

-- pet_owners: add address if missing
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pet_owners' AND COLUMN_NAME = 'address'
);
SET @sql := IF(@exists = 0,
  'ALTER TABLE pet_owners ADD COLUMN address VARCHAR(1024)',
  'ALTER TABLE pet_owners MODIFY COLUMN address VARCHAR(1024)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pet_owners: modify phone if exists
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pet_owners' AND COLUMN_NAME = 'phone'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE pet_owners MODIFY COLUMN phone VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- vets: modify license if it exists
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vets' AND COLUMN_NAME = 'license'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE vets MODIFY COLUMN license VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- pets: modify microchip_number if it exists
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pets' AND COLUMN_NAME = 'microchip_number'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE pets MODIFY COLUMN microchip_number VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- clinics: modify address if exists
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'address'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE clinics MODIFY COLUMN address VARCHAR(1024)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- clinics: modify phone if exists
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'phone'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE clinics MODIFY COLUMN phone VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- clinics: modify email if exists
SET @exists := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'clinics' AND COLUMN_NAME = 'email'
);
SET @sql := IF(@exists > 0,
  'ALTER TABLE clinics MODIFY COLUMN email VARCHAR(255)',
  'SELECT 1'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
