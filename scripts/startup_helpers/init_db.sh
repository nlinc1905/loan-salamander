#!/bin/sh

# Exit on error and treat unset variables as errors
set -eu

SCHEMA_PATH="src/prisma/schema.prisma"

# Always generate Prisma client before DB operations.
echo "🔧 Generating Prisma client..."
npx prisma generate --schema="$SCHEMA_PATH"

echo "🧱 Syncing Prisma schema to local SQLite database..."
npx prisma db push --schema="$SCHEMA_PATH"

echo "🌱 Ensuring demo loan exists..."
npx prisma db execute --schema="$SCHEMA_PATH" --stdin <<'SQL'
INSERT INTO "Loan" (
  id,
  name,
  "assetCost",
  "interestRate",
  years,
  "createdAt",
  "updatedAt"
)
SELECT
  'loan_standard_demo',
  'Standard Home Loan',
  450000,
  6.5,
  30,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
WHERE NOT EXISTS (
  SELECT 1 FROM "Loan" WHERE id = 'loan_standard_demo'
);
SQL

echo "🌱 Ensuring seed user exists..."
SEED_USER_EMAIL="${SEED_USER_EMAIL:-seed.user@example.com}"
SEED_USER_NAME="${SEED_USER_NAME:-Seed User}"
SEED_USER_PASSWORD="${SEED_USER_PASSWORD:-SeedUser123}"

npx prisma db execute --schema="$SCHEMA_PATH" --stdin <<SQL
INSERT INTO "User" (
  email,
  name,
  password,
  premium_access_until
)
SELECT
  '$SEED_USER_EMAIL',
  '$SEED_USER_NAME',
  '$SEED_USER_PASSWORD',
  '3000-01-01 00:00:00'
WHERE NOT EXISTS (
  SELECT 1 FROM "User" WHERE email = '$SEED_USER_EMAIL'
);
SQL

echo "✅ Database initialization complete."
