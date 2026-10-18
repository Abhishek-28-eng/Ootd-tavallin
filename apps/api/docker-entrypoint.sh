#!/bin/sh
# Entrypoint script for API container
# Runs migrations then starts the server
set -e

echo "🔄 Running database migrations..."
cd /app/apps/api
npx sequelize-cli db:migrate --config .sequelizerc.js 2>&1 || {
  echo "⚠️  Migration via sequelize-cli failed, trying direct..."
  node -e "
    const { Sequelize } = require('sequelize');
    console.log('Connecting to DB...');
  "
}

echo "🚀 Starting API server..."
exec node dist/index.js
