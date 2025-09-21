-- Use UTF-8 everywhere
SET NAMES utf8mb4;

-- USERS table
CREATE TABLE IF NOT EXISTS users (
                                     id             BINARY(16)     NOT NULL PRIMARY KEY,
    email          VARCHAR(255)   NOT NULL UNIQUE,
    password_hash  VARCHAR(255)   NOT NULL,
    role           ENUM('PET_OWNER','CLINIC_ADMIN','VET','ASSISTANT','SUPERADMIN') NOT NULL,
    email_verified BOOLEAN        NOT NULL DEFAULT FALSE,
    mfa_enabled    BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- CLINICS table
CREATE TABLE IF NOT EXISTS clinics (
                                       id           BINARY(16)     NOT NULL PRIMARY KEY,
    name         VARCHAR(255)   NOT NULL,
    legal_name   VARCHAR(255),
    reg_number   VARCHAR(100),
    country      VARCHAR(100),
    city         VARCHAR(100),
    email        VARCHAR(255),
    phone        VARCHAR(50),
    verified     BOOLEAN        NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PET OWNER PROFILES
CREATE TABLE IF NOT EXISTS pet_owner_profiles (
                                                  user_id       BINARY(16)     NOT NULL PRIMARY KEY,
    full_name     VARCHAR(255)   NOT NULL,
    date_of_birth DATE,
    address       VARCHAR(500),
    CONSTRAINT fk_pet_owner_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- VET PROFILES
CREATE TABLE IF NOT EXISTS vet_profiles (
                                            user_id      BINARY(16)     NOT NULL PRIMARY KEY,
    clinic_id    BINARY(16)     NOT NULL,
    full_name    VARCHAR(255)   NOT NULL,
    license_no   VARCHAR(100),
    title        VARCHAR(100),
    CONSTRAINT fk_vet_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
    CONSTRAINT fk_vet_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- PETS
CREATE TABLE IF NOT EXISTS pets (
                                    id            BINARY(16)     NOT NULL PRIMARY KEY,
    owner_user_id BINARY(16)     NOT NULL,
    clinic_id     BINARY(16),
    name          VARCHAR(120)   NOT NULL,
    species       VARCHAR(60)    NOT NULL,
    breed         VARCHAR(120),
    sex           ENUM('M','F','U'),
    birth_date    DATE,
    microchip_no  VARCHAR(64),
    UNIQUE KEY uq_pets_microchip (microchip_no),
    CONSTRAINT fk_pet_owner  FOREIGN KEY (owner_user_id) REFERENCES pet_owner_profiles(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_pet_clinic FOREIGN KEY (clinic_id)     REFERENCES clinics(id)               ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- MEDICAL RECORDS
CREATE TABLE IF NOT EXISTS medical_records (
                                               id                 BINARY(16) NOT NULL PRIMARY KEY,
    pet_id             BINARY(16) NOT NULL,
    clinic_id          BINARY(16) NOT NULL,
    author_vet_user_id BINARY(16) NOT NULL,
    record_type        VARCHAR(80),
    notes              TEXT,
    created_at         TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rec_pet    FOREIGN KEY (pet_id)             REFERENCES pets(id)   ON DELETE CASCADE,
    CONSTRAINT fk_rec_clinic FOREIGN KEY (clinic_id)          REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_rec_author FOREIGN KEY (author_vet_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- VACCINATIONS
CREATE TABLE IF NOT EXISTS vaccinations (
                                            id             BINARY(16) NOT NULL PRIMARY KEY,
    pet_id         BINARY(16) NOT NULL,
    clinic_id      BINARY(16) NOT NULL,
    vaccine_name   VARCHAR(120) NOT NULL,
    lot_no         VARCHAR(80),
    administered_at DATE NOT NULL,
    due_at          DATE,
    certificate_url VARCHAR(512),
    CONSTRAINT fk_vax_pet    FOREIGN KEY (pet_id)    REFERENCES pets(id)    ON DELETE CASCADE,
    CONSTRAINT fk_vax_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- APPOINTMENTS
CREATE TABLE IF NOT EXISTS appointments (
                                            id          BINARY(16) NOT NULL PRIMARY KEY,
    pet_id      BINARY(16) NOT NULL,
    clinic_id   BINARY(16) NOT NULL,
    vet_user_id BINARY(16),
    starts_at   DATETIME(3) NOT NULL,
    ends_at     DATETIME(3) NOT NULL,
    status      ENUM('BOOKED','CONFIRMED','CANCELLED','DONE') NOT NULL DEFAULT 'BOOKED',
    CONSTRAINT fk_appt_pet   FOREIGN KEY (pet_id)    REFERENCES pets(id)    ON DELETE CASCADE,
    CONSTRAINT fk_appt_clinic FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    CONSTRAINT fk_appt_vet    FOREIGN KEY (vet_user_id) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
                                          id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
                                          user_id    BINARY(16),
    clinic_id  BINARY(16),
    action     VARCHAR(120) NOT NULL,
    entity     VARCHAR(120),
    entity_id  VARCHAR(120),
    ip         VARCHAR(64),
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_audit_clinic (clinic_id),
    KEY idx_audit_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
