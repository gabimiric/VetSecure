-- Create roles table to match JPA entity com.vetsecure.backend.model.Role
CREATE TABLE IF NOT EXISTS roles (
                                     id   BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     name ENUM('SUPER_ADMIN','CLINIC_ADMIN','ASSISTANT','VET','PET_OWNER','PET') NOT NULL UNIQUE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default roles if they are missing
INSERT IGNORE INTO roles(name) VALUES
  ('SUPER_ADMIN'),
  ('CLINIC_ADMIN'),
  ('ASSISTANT'),
  ('VET'),
  ('PET_OWNER');

