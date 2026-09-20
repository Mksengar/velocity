```sql
-- ============================================================
-- Velocity BI - Sample Data
-- File: database/sample-data.sql
-- Database: MySQL 8+
-- ============================================================

USE velocity_bi;

-- ============================================================
-- 1. Disable Foreign Key Checks
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;


-- ============================================================
-- 2. Clear Existing Sample Data
-- ============================================================

TRUNCATE TABLE login_sessions;
TRUNCATE TABLE user_settings;
TRUNCATE TABLE forecasts;
TRUNCATE TABLE time_series;
TRUNCATE TABLE visualizations;
TRUNCATE TABLE analyses;
TRUNCATE TABLE activity;
TRUNCATE TABLE reports;
TRUNCATE TABLE dashboards;
TRUNCATE TABLE datasets;
TRUNCATE TABLE users;


-- ============================================================
-- 3. Sample Users
-- ============================================================
-- Demo password for all users:
-- password
--
-- This is a bcrypt hash for demonstration purposes only.

INSERT INTO users (
    id,
    name,
    email,
    password_hash,
    role,
    profile_image,
    is_active
)
VALUES
(
    1,
    'System Administrator',
    'admin@velocitybi.com',
    '$2b$12$LQv3c1yqBWw5Ff5kJ0KfOeK0x3p8rQ5Yh2H5fQ8fQ1L8vJ6K7W8eK',
    'admin',
    NULL,
    TRUE
),
(
    2,
    'Rahul Sharma',
    'rahul@velocitybi.com',
    '$2b$12$LQv3c1yqBWw5Ff5kJ0KfOeK0x3p8rQ5Yh2H5fQ8fQ1L8vJ6K7W8eK',
    'user',
    NULL,
    TRUE
),
(
    3,
    'Priya Patel',
    'priya@velocitybi.com',
    '$2b$12$LQv3c1yqBWw5Ff5kJ0KfOeK0x3p8rQ5Yh2H5fQ8fQ1L8vJ6K7W8eK',
    'user',
    NULL,
    TRUE
),
(
    4,
    'Amit Kumar',
    'amit@velocitybi.com',
    '$2b$12$LQv3c1yqBWw5Ff5kJ0KfOeK0x3p8rQ5Yh2H5fQ8fQ1L8vJ6K7W8eK',
    'user',
    NULL,
    TRUE
);


-- ============================================================
-- 4. Sample Datasets
-- ============================================================

INSERT INTO datasets (
    id,
    user_id,
    name,
    description,
    file_name,
    file_path,
    file_type,
    file_size,
    row_count,
    column_count,
    status
)
VALUES
(
    1,
    2,
    'Sales Performance',
    'Monthly sales performance dataset containing product, region, revenue and profit information.',
    'sales_performance.csv',
    'uploads/datasets/sales_performance.csv',
    'csv',
    245760,
    1250,
    12,
    'completed'
),
(
    2,
    2,
    'Customer Analytics',
    'Customer demographics, purchase behavior and customer lifetime value data.',
    'customer_analytics.xlsx',
    'uploads/datasets/customer_analytics.xlsx',
    'xlsx',
    524288,
    3500,
    15,
    'completed'
),
(
    3,
    3,
    'Website Traffic',
    'Website visitors, sessions, page views and conversion information.',
    'website_traffic.csv',
    'uploads/datasets/website_traffic.csv',
    'csv',
    184320,
    8200,
    10,
    'completed'
),
(
    4,
    3,
    'Employee Data',
    'Employee department, salary, experience and performance information.',
    'employee_data.xlsx',
    'uploads/datasets/employee_data.xlsx',
    'xlsx',
    327680,
    850,
    14,
    'completed'
),
(
    5,
    4,
    'Product Inventory',
    'Product inventory, stock levels, suppliers and reorder information.',
    'product_inventory.csv',
    'uploads/datasets/product_inventory.csv',
    'csv',
    143360,
    600,
    11,
    'completed'
),
(
    6,
    4,
    'Marketing Campaign',
    'Digital marketing campaign performance data.',
    'marketing_campaign.json',
    'uploads/datasets/marketing_campaign.json',
    'json',
    198400,
    2100,
    13,
    'completed'
);


-- ============================================================
-- 5. Sample Dashboards
-- ============================================================

INSERT INTO dashboards (
    id,
    user_id,
    dataset_id,
    name,
    description,
    layout,
    is_public
)
VALUES
(
    1,
    2,
    1,
    'Sales Dashboard',
    'Interactive dashboard for monitoring sales performance.',
    JSON_OBJECT(
        'columns', 12,
        'rows', 8,
        'theme', 'dark'
    ),
    TRUE
),
(
    2,
    2,
    2,
    'Customer Analytics Dashboard',
    'Customer behavior and segmentation dashboard.',
    JSON_OBJECT(
        'columns', 12,
        'rows', 8,
        'theme', 'dark'
    ),
    FALSE
),
(
    3,
    3,
    3,
    'Website Analytics',
    'Website traffic and conversion dashboard.',
    JSON_OBJECT(
        'columns', 12,
        'rows', 8,
        'theme', 'light'
    ),
    TRUE
),
(
    4,
    4,
    5,
    'Inventory Dashboard',
    'Inventory and stock monitoring dashboard.',
    JSON_OBJECT(
        'columns', 12,
        'rows', 8,
        'theme', 'dark'
    ),
    FALSE
);


-- ============================================================
-- 6. Sample Reports
-- ============================================================

INSERT INTO reports (
    id,
    user_id,
    dataset_id,
    dashboard_id,
    name,
    description,
    report_type,
    file_path,
    format,
    status
)
VALUES
(
    1,
    2,
    1,
    1,
    'Monthly Sales Report',
    'Monthly sales and profit performance report.',
    'summary',
    'reports/monthly_sales_report.pdf',
    'pdf',
    'completed'
),
(
    2,
    2,
    2,
    2,
    'Customer Analysis Report',
    'Customer segmentation and purchasing behavior analysis.',
    'analysis',
    'reports/customer_analysis.xlsx',
    'xlsx',
    'completed'
),
(
    3,
    3,
    3,
    3,
    'Website Traffic Report',
    'Website traffic and conversion analysis.',
    'dashboard',
    'reports/website_traffic_report.pdf',
    'pdf',
    'completed'
),
(
    4,
    4,
    5,
    4,
    'Inventory Summary',
    'Product inventory and stock-level summary.',
    'summary',
    'reports/inventory_summary.csv',
    'csv',
    'completed'
);


-- ============================================================
-- 7. Sample Analyses
-- ============================================================

INSERT INTO analyses (
    id,
    user_id,
    dataset_id,
    name,
    analysis_type,
    parameters,
    results,
    status
)
VALUES
(
    1,
    2,
    1,
    'Sales EDA',
    'eda',
    JSON_OBJECT(
        'include_missing_values', TRUE,
        'include_statistics', TRUE,
        'include_duplicates', TRUE
    ),
    JSON_OBJECT(
        'total_rows', 1250,
        'total_columns', 12,
        'missing_values', 23,
        'duplicate_rows', 5
    ),
    'completed'
),
(
    2,
    2,
    1,
    'Sales Correlation Analysis',
    'correlation',
    JSON_OBJECT(
        'method', 'pearson'
    ),
    JSON_OBJECT(
        'strongest_positive', 'revenue-profit',
        'correlation', 0.87
    ),
    'completed'
),
(
    3,
    3,
    3,
    'Website Statistics',
    'statistics',
    JSON_OBJECT(
        'include_mean', TRUE,
        'include_median', TRUE,
        'include_std', TRUE
    ),
    JSON_OBJECT(
        'mean_sessions', 1250.50,
        'median_sessions', 1180,
        'standard_deviation', 342.25
    ),
    'completed'
),
(
    4,
    4,
    5,
    'Inventory Data Cleaning',
    'data_cleaning',
    JSON_OBJECT(
        'remove_duplicates', TRUE,
        'handle_missing_values', TRUE
    ),
    JSON_OBJECT(
        'duplicates_removed', 18,
        'missing_values_fixed', 31
    ),
    'completed'
);


-- ============================================================
-- 8. Sample Visualizations
-- ============================================================

INSERT INTO visualizations (
    id,
    user_id,
    dataset_id,
    dashboard_id,
    name,
    chart_type,
    configuration
)
VALUES
(
    1,
    2,
    1,
    1,
    'Monthly Revenue',
    'line',
    JSON_OBJECT(
        'x_axis', 'month',
        'y_axis', 'revenue',
        'aggregation', 'sum'
    )
),
(
    2,
    2,
    1,
    1,
    'Revenue by Region',
    'bar',
    JSON_OBJECT(
        'x_axis', 'region',
        'y_axis', 'revenue',
        'aggregation', 'sum'
    )
),
(
    3,
    2,
    1,
    1,
    'Profit Distribution',
    'pie',
    JSON_OBJECT(
        'category', 'product',
        'value', 'profit'
    )
),
(
    4,
    3,
    3,
    3,
    'Website Sessions',
    'area',
    JSON_OBJECT(
        'x_axis', 'date',
        'y_axis', 'sessions'
    )
),
(
    5,
    3,
    3,
    3,
    'Traffic Sources',
    'doughnut',
    JSON_OBJECT(
        'category', 'source',
        'value', 'visitors'
    )
),
(
    6,
    4,
    5,
    4,
    'Inventory by Category',
    'bar',
    JSON_OBJECT(
        'x_axis', 'category',
        'y_axis', 'stock_quantity'
    )
);


-- ============================================================
-- 9. Sample Time Series
-- ============================================================

INSERT INTO time_series (
    id,
    user_id,
    dataset_id,
    name,
    date_column,
    value_column,
    frequency,
    configuration,
    results
)
VALUES
(
    1,
    2,
    1,
    'Monthly Revenue Trend',
    'month',
    'revenue',
    'monthly',
    JSON_OBJECT(
        'aggregation', 'sum',
        'fill_missing', TRUE
    ),
    JSON_OBJECT(
        'trend', 'increasing',
        'growth_rate', 12.5
    )
),
(
    2,
    3,
    3,
    'Daily Website Traffic',
    'date',
    'sessions',
    'daily',
    JSON_OBJECT(
        'aggregation', 'sum'
    ),
    JSON_OBJECT(
        'trend', 'stable',
        'growth_rate', 4.8
    )
);


-- ============================================================
-- 10. Sample Forecasts
-- ============================================================

INSERT INTO forecasts (
    id,
    user_id,
    dataset_id,
    name,
    model_type,
    target_column,
    forecast_period,
    parameters,
    results,
    status
)
VALUES
(
    1,
    2,
    1,
    'Revenue Forecast',
    'linear_regression',
    'revenue',
    6,
    JSON_OBJECT(
        'confidence_level', 0.95
    ),
    JSON_OBJECT(
        'predicted_growth', 14.2,
        'forecast_months', 6
    ),
    'completed'
),
(
    2,
    3,
    3,
    'Website Traffic Forecast',
    'moving_average',
    'sessions',
    30,
    JSON_OBJECT(
        'window', 7
    ),
    JSON_OBJECT(
        'expected_sessions', 42000
    ),
    'completed'
);


-- ============================================================
-- 11. User Settings
-- ============================================================

INSERT INTO user_settings (
    id,
    user_id,
    theme,
    language,
    notifications_enabled,
    email_notifications,
    settings
)
VALUES
(
    1,
    1,
    'dark',
    'en',
    TRUE,
    TRUE,
    JSON_OBJECT(
        'sidebar_collapsed', FALSE,
        'auto_refresh', TRUE
    )
),
(
    2,
    2,
    'dark',
    'en',
    TRUE,
    TRUE,
    JSON_OBJECT(
        'sidebar_collapsed', FALSE,
        'auto_refresh', TRUE
    )
),
(
    3,
    3,
    'light',
    'en',
    TRUE,
    FALSE,
    JSON_OBJECT(
        'sidebar_collapsed', TRUE,
        'auto_refresh', FALSE
    )
),
(
    4,
    4,
    'dark',
    'en',
    TRUE,
    TRUE,
    JSON_OBJECT(
        'sidebar_collapsed', FALSE,
        'auto_refresh', TRUE
    )
);


-- ============================================================
-- 12. Activity Logs
-- ============================================================

INSERT INTO activity (
    id,
    user_id,
    action,
    description,
    entity_type,
    entity_id,
    ip_address,
    user_agent
)
VALUES
(
    1,
    1,
    'LOGIN',
    'Administrator logged into the system.',
    'user',
    1,
    '127.0.0.1',
    'Chrome'
),
(
    2,
    2,
    'LOGIN',
    'User logged into Velocity BI.',
    'user',
    2,
    '127.0.0.1',
    'Chrome'
),
(
    3,
    2,
    'DATASET_UPLOAD',
    'Uploaded Sales Performance dataset.',
    'dataset',
    1,
    '127.0.0.1',
    'Chrome'
),
(
    4,
    2,
    'ANALYSIS_CREATED',
    'Created Sales EDA analysis.',
    'analysis',
    1,
    '127.0.0.1',
    'Chrome'
),
(
    5,
    2,
    'DASHBOARD_CREATED',
    'Created Sales Dashboard.',
    'dashboard',
    1,
    '127.0.0.1',
    'Chrome'
),
(
    6,
    3,
    'DATASET_UPLOAD',
    'Uploaded Website Traffic dataset.',
    'dataset',
    3,
    '127.0.0.1',
    'Chrome'
),
(
    7,
    3,
    'REPORT_CREATED',
    'Generated Website Traffic Report.',
    'report',
    3,
    '127.0.0.1',
    'Chrome'
),
(
    8,
    4,
    'DATASET_UPLOAD',
    'Uploaded Product Inventory dataset.',
    'dataset',
    5,
    '127.0.0.1',
    'Chrome'
),
(
    9,
    4,
    'VISUALIZATION_CREATED',
    'Created Inventory by Category chart.',
    'visualization',
    6,
    '127.0.0.1',
    'Chrome'
);


-- ============================================================
-- 13. Sample Login Sessions
-- ============================================================

INSERT INTO login_sessions (
    id,
    user_id,
    token_hash,
    ip_address,
    user_agent,
    expires_at
)
VALUES
(
    1,
    2,
    'demo_token_hash_001',
    '127.0.0.1',
    'Chrome',
    DATE_ADD(NOW(), INTERVAL 7 DAY)
),
(
    2,
    3,
    'demo_token_hash_002',
    '127.0.0.1',
    'Chrome',
    DATE_ADD(NOW(), INTERVAL 7 DAY)
);


-- ============================================================
-- 14. Re-enable Foreign Key Checks
-- ============================================================

SET FOREIGN_KEY_CHECKS = 1;


-- ============================================================
-- 15. Verification Queries
-- ============================================================

SELECT 'Sample data inserted successfully.' AS message;

SELECT COUNT(*) AS total_users
FROM users;

SELECT COUNT(*) AS total_datasets
FROM datasets;

SELECT COUNT(*) AS total_dashboards
FROM dashboards;

SELECT COUNT(*) AS total_reports
FROM reports;

SELECT COUNT(*) AS total_analyses
FROM analyses;

SELECT COUNT(*) AS total_visualizations
FROM visualizations;

SELECT COUNT(*) AS total_activities
FROM activity;


-- ============================================================
-- End of sample-data.sql
-- ============================================================
```
