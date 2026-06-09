CREATE USER reports_app WITH PASSWORD 'reports_app';

CREATE DATABASE "reports-db" OWNER reports_app;

GRANT ALL PRIVILEGES ON DATABASE "reports-db" TO reports_app;
