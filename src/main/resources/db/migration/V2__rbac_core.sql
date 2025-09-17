-- USERS for future auth (keep nullable so we don’t break current flows)
CREATE TABLE IF NOT EXISTS users (
                                     id           BIGINT PRIMARY KEY AUTO_INCREMENT,
                                     email        VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255),
    name         VARCHAR(120),
    phone        VARCHAR(40),
    role         ENUM('PLATFORM_ADMIN','CLINIC_ADMIN','VET','OWNER') NOT NULL DEFAULT 'OWNER',
    clinic_id    BIGINT NULL,
    status       ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- link owners -> users (owner account)
ALTER TABLE owners
    ADD COLUMN user_id BIGINT NULL;

CREATE INDEX idx_owners_user_id ON owners(user_id);

ALTER TABLE owners
    ADD CONSTRAINT fk_owners_user
        FOREIGN KEY (user_id) REFERENCES users(id);

-- CLINIC REQUESTS (public form target)
CREATE TABLE IF NOT EXISTS clinic_requests (
                                               id           BIGINT PRIMARY KEY AUTO_INCREMENT,
                                               clinic_name  VARCHAR(160) NOT NULL,
    address      VARCHAR(255) NOT NULL,
    city         VARCHAR(120),
    phone        VARCHAR(40),
    admin_name   VARCHAR(120) NOT NULL,
    admin_email  VARCHAR(190) NOT NULL,
    status       ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- CLINICS (created after approval)
CREATE TABLE IF NOT EXISTS clinics (
                                       id           BIGINT PRIMARY KEY AUTO_INCREMENT,
                                       name         VARCHAR(160) NOT NULL,
    address      VARCHAR(255) NOT NULL,
    city         VARCHAR(120),
    phone        VARCHAR(40),
    status       ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;