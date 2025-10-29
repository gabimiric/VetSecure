CREATE TABLE security_audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    timestamp TIMESTAMP NOT NULL,
    username VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    method_name VARCHAR(255),
    class_name VARCHAR(255),
    parameters VARCHAR(2048),
    INDEX idx_audit_timestamp (timestamp),
    INDEX idx_audit_username (username),
    INDEX idx_audit_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;