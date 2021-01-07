#!/bin/sh
set -e

export PGPASSWORD="$DB_PASSWORD"
psql -f /usr/src/api/sql/scriptSql.sql --host=localhost --port=5432 --dbname=chy_01_db --username=$DB_USER


NODE_ENV=$API_ENV node route.js