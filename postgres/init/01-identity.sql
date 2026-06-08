CREATE USER identity_app WITH PASSWORD 'identity_app';

CREATE DATABASE "identity-db" OWNER identity_app;

GRANT ALL PRIVILEGES ON DATABASE "identity-db" TO identity_app;
