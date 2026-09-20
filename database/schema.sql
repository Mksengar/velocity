```sql
-- ============================================================
-- Velocity BI - Database Schema
-- File: database/schema.sql
-- Database: MySQL 8+
-- ============================================================

-- ------------------------------------------------------------
-- 1. Create Database
-- ------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS velocity_bi
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE velocity_bi;


-- ============================================================
-- 2. Users Table
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(150) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',

    profile_image VARCHAR(500) DEFAULT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_users_email (email),
    INDEX idx_users_role (role),
    INDEX idx_users_active (is_active)
);


-- ============================================================
-- 3. Datasets Table
-- ============================================================

CREATE TABLE IF NOT EXISTS datasets (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT DEFAULT NULL,

    file_name VARCHAR(255) DEFAULT NULL,

    file_path VARCHAR(500) DEFAULT NULL,

    file_type ENUM(
        'csv',
        'xlsx',
        'xls',
        'json',
        'sql'
    ) DEFAULT NULL,

    file_size BIGINT UNSIGNED DEFAULT NULL,

    row_count BIGINT UNSIGNED DEFAULT 0,

    column_count INT UNSIGNED DEFAULT 0,

    status ENUM(
        'uploaded',
        'processing',
        'completed',
        'failed'
    ) NOT NULL DEFAULT 'uploaded',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_datasets_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_datasets_user (user_id),
    INDEX idx_datasets_status (status),
    INDEX idx_datasets_created (created_at)
);


-- ============================================================
-- 4. Dashboards Table
-- ============================================================

CREATE TABLE IF NOT EXISTS dashboards (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    dataset_id INT UNSIGNED DEFAULT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT DEFAULT NULL,

    layout JSON DEFAULT NULL,

    is_public BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_dashboards_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_dashboards_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_dashboards_user (user_id),
    INDEX idx_dashboards_dataset (dataset_id),
    INDEX idx_dashboards_public (is_public)
);


-- ============================================================
-- 5. Reports Table
-- ============================================================

CREATE TABLE IF NOT EXISTS reports (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    dataset_id INT UNSIGNED DEFAULT NULL,

    dashboard_id INT UNSIGNED DEFAULT NULL,

    name VARCHAR(200) NOT NULL,

    description TEXT DEFAULT NULL,

    report_type ENUM(
        'analysis',
        'dashboard',
        'summary',
        'custom'
    ) NOT NULL DEFAULT 'analysis',

    file_path VARCHAR(500) DEFAULT NULL,

    format ENUM(
        'pdf',
        'xlsx',
        'csv',
        'json',
        'html'
    ) DEFAULT NULL,

    status ENUM(
        'draft',
        'generating',
        'completed',
        'failed'
    ) NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_reports_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_reports_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_reports_dashboard
        FOREIGN KEY (dashboard_id)
        REFERENCES dashboards(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_reports_user (user_id),
    INDEX idx_reports_dataset (dataset_id),
    INDEX idx_reports_dashboard (dashboard_id),
    INDEX idx_reports_status (status)
);


-- ============================================================
-- 6. Activity Table
-- ============================================================

CREATE TABLE IF NOT EXISTS activity (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED DEFAULT NULL,

    action VARCHAR(100) NOT NULL,

    description TEXT DEFAULT NULL,

    entity_type VARCHAR(50) DEFAULT NULL,

    entity_id INT UNSIGNED DEFAULT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    user_agent TEXT DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_activity_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_activity_user (user_id),
    INDEX idx_activity_action (action),
    INDEX idx_activity_entity (entity_type, entity_id),
    INDEX idx_activity_created (created_at)
);


-- ============================================================
-- 7. Analysis Table
-- ============================================================

CREATE TABLE IF NOT EXISTS analyses (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    dataset_id INT UNSIGNED NOT NULL,

    name VARCHAR(200) NOT NULL,

    analysis_type ENUM(
        'eda',
        'correlation',
        'statistics',
        'data_cleaning',
        'time_series',
        'forecasting',
        'custom'
    ) NOT NULL,

    parameters JSON DEFAULT NULL,

    results JSON DEFAULT NULL,

    status ENUM(
        'pending',
        'processing',
        'completed',
        'failed'
    ) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_analyses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_analyses_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_analyses_user (user_id),
    INDEX idx_analyses_dataset (dataset_id),
    INDEX idx_analyses_type (analysis_type),
    INDEX idx_analyses_status (status)
);


-- ============================================================
-- 8. Visualizations Table
-- ============================================================

CREATE TABLE IF NOT EXISTS visualizations (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    dataset_id INT UNSIGNED NOT NULL,

    dashboard_id INT UNSIGNED DEFAULT NULL,

    name VARCHAR(200) NOT NULL,

    chart_type ENUM(
        'bar',
        'line',
        'pie',
        'doughnut',
        'area',
        'scatter',
        'histogram',
        'heatmap',
        'boxplot',
        'radar',
        'table',
        'custom'
    ) NOT NULL,

    configuration JSON DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_visualizations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_visualizations_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_visualizations_dashboard
        FOREIGN KEY (dashboard_id)
        REFERENCES dashboards(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    INDEX idx_visualizations_user (user_id),
    INDEX idx_visualizations_dataset (dataset_id),
    INDEX idx_visualizations_dashboard (dashboard_id),
    INDEX idx_visualizations_chart (chart_type)
);


-- ============================================================
-- 9. Time Series Table
-- ============================================================

CREATE TABLE IF NOT EXISTS time_series (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    dataset_id INT UNSIGNED NOT NULL,

    name VARCHAR(200) NOT NULL,

    date_column VARCHAR(150) NOT NULL,

    value_column VARCHAR(150) NOT NULL,

    frequency ENUM(
        'daily',
        'weekly',
        'monthly',
        'quarterly',
        'yearly'
    ) DEFAULT 'daily',

    configuration JSON DEFAULT NULL,

    results JSON DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_time_series_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_time_series_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_time_series_user (user_id),
    INDEX idx_time_series_dataset (dataset_id)
);


-- ============================================================
-- 10. Forecasting Table
-- ============================================================

CREATE TABLE IF NOT EXISTS forecasts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    dataset_id INT UNSIGNED NOT NULL,

    name VARCHAR(200) NOT NULL,

    model_type ENUM(
        'linear_regression',
        'moving_average',
        'arima',
        'exponential_smoothing',
        'prophet',
        'custom'
    ) NOT NULL,

    target_column VARCHAR(150) NOT NULL,

    forecast_period INT UNSIGNED DEFAULT 0,

    parameters JSON DEFAULT NULL,

    results JSON DEFAULT NULL,

    status ENUM(
        'pending',
        'processing',
        'completed',
        'failed'
    ) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_forecasts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_forecasts_dataset
        FOREIGN KEY (dataset_id)
        REFERENCES datasets(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_forecasts_user (user_id),
    INDEX idx_forecasts_dataset (dataset_id),
    INDEX idx_forecasts_status (status)
);


-- ============================================================
-- 11. User Settings Table
-- ============================================================

CREATE TABLE IF NOT EXISTS user_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL UNIQUE,

    theme ENUM(
        'light',
        'dark',
        'system'
    ) NOT NULL DEFAULT 'system',

    language VARCHAR(20) NOT NULL DEFAULT 'en',

    notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,

    email_notifications BOOLEAN NOT NULL DEFAULT TRUE,

    settings JSON DEFAULT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_settings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


-- ============================================================
-- 12. Login Sessions Table
-- ============================================================

CREATE TABLE IF NOT EXISTS login_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    user_id INT UNSIGNED NOT NULL,

    token_hash VARCHAR(255) NOT NULL,

    ip_address VARCHAR(45) DEFAULT NULL,

    user_agent TEXT DEFAULT NULL,

    expires_at DATETIME NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    revoked_at DATETIME DEFAULT NULL,

    CONSTRAINT fk_login_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    INDEX idx_sessions_user (user_id),
    INDEX idx_sessions_token (token_hash),
    INDEX idx_sessions_expires (expires_at)
);


-- ============================================================
-- 13. Insert Default Admin
-- ============================================================
-- IMPORTANT:
-- Replace the password_hash with a bcrypt hash generated
-- by your Flask application before using this record.

INSERT INTO users (
    name,
    email,
    password_hash,
    role
)
VALUES (
    'System Administrator',
    'admin@velocitybi.com',
    'REPLACE_WITH_BCRYPT_HASH',
    'admin'
)
ON DUPLICATE KEY UPDATE
    email = email;


-- ============================================================
-- 14. Helpful Views
-- ============================================================

CREATE OR REPLACE VIEW user_dataset_summary AS
SELECT
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    COUNT(d.id) AS total_datasets,
    COALESCE(SUM(d.row_count), 0) AS total_rows,
    COALESCE(SUM(d.file_size), 0) AS total_file_size,
    MAX(d.created_at) AS last_dataset_upload
FROM users u
LEFT JOIN datasets d
    ON u.id = d.user_id
GROUP BY
    u.id,
    u.name,
    u.email;


CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
    d.id AS dashboard_id,
    d.name AS dashboard_name,
    d.user_id,
    u.name AS owner_name,
    d.dataset_id,
    ds.name AS dataset_name,
    d.is_public,
    d.created_at,
    d.updated_at
FROM dashboards d
JOIN users u
    ON d.user_id = u.id
LEFT JOIN datasets ds
    ON d.dataset_id = ds.id;


-- ============================================================
-- 15. Database Verification
-- ============================================================

SELECT
    'Velocity BI database initialized successfully' AS message;

SHOW TABLES;
```
