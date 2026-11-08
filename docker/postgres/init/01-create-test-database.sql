-- Runs once when the volume is first created.
-- The test suite needs a real PostgreSQL database because the schema uses PostGIS types.
CREATE DATABASE delivery_app_test;

\connect delivery_app
CREATE EXTENSION IF NOT EXISTS postgis;

\connect delivery_app_test
CREATE EXTENSION IF NOT EXISTS postgis;
