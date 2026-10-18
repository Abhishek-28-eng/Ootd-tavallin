-- Create test database (used by Jest integration tests)
CREATE DATABASE IF NOT EXISTS tavallin_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON tavallin_test.* TO 'tavallin'@'%';

-- Ensure dev database has correct charset
ALTER DATABASE tavallin_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

FLUSH PRIVILEGES;
