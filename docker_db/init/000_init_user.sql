-- Create sporttrack_user if it doesn't exist
DO
$$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'sporttrack_user') THEN
    CREATE USER sporttrack_user WITH PASSWORD 'secure_password_123';
    ALTER USER sporttrack_user CREATEDB SUPERUSER;
  END IF;
END
$$;

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE sporttrack_db OWNER sporttrack_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sporttrack_db');

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE sporttrack_db TO sporttrack_user;
