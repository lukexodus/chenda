#!/bin/bash
# Chenda Backend Setup & Start Script
# Run this script from the project root directory

echo "🚀 Chenda Backend Setup & Start"
echo "================================"
echo ""

# Change to server directory
cd "$(dirname "$0")"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "   Creating default .env file..."
    cat > .env << 'EOF'
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=chenda
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001
NODE_ENV=development

# Session Configuration
SESSION_SECRET=chenda-super-secret-key-change-this-in-production-2026

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# File Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880
EOF
    echo "✅ Created .env file with default settings"
    echo "   ⚠️  Please update DB_PASSWORD if needed!"
    echo ""
fi

# Test database connection
echo "📡 Testing database connection..."
node ../migrations/test-connection.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Cannot connect to PostgreSQL database!"
    echo ""
    echo "Please ensure:"
    echo "  1. PostgreSQL is installed (version 15+)"
    echo "  2. PostgreSQL service is running"
    echo "  3. Database credentials in .env are correct"
    echo ""
    echo "To start PostgreSQL on Windows:"
    echo "  • Open Services (services.msc)"
    echo "  • Find 'postgresql-x64-15' (or similar)"
    echo "  • Right-click → Start"
    echo ""
    echo "Or use command (Run as Administrator):"
    echo "  net start postgresql-x64-15"
    echo ""
    echo "To create the database (after PostgreSQL is running):"
    echo "  psql -U postgres -c \"CREATE DATABASE chenda;\""
    echo "  psql -U postgres -d chenda -c \"CREATE EXTENSION postgis;\""
    echo ""
    exit 1
fi

echo "✅ Database connection successful!"
echo ""

# Check if database has migrations applied
echo "🔧 Checking migration status..."
node ../migrations/migrate.js status

if [ $? -ne 0 ]; then
    echo ""
    echo "📦 Running database migrations..."
    node ../migrations/migrate.js up
    
    if [ $? -eq 0 ]; then
        echo "✅ Migrations applied successfully!"
    else
        echo "❌ Migration failed!"
        exit 1
    fi
fi

# Check if database has seed data
echo ""
echo "🌱 Checking seed data..."
SEED_CHECK=$(node -e "
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool();
pool.query('SELECT COUNT(*) FROM product_types')
  .then(res => {
    console.log(res.rows[0].count);
    pool.end();
  })
  .catch(err => {
    console.log('0');
    pool.end();
  });
")

if [ "$SEED_CHECK" -lt "10" ]; then
    echo "📦 Seeding database with test data..."
    cd ../seeds
    node seed.js
    cd ../server
    echo "✅ Database seeded successfully!"
else
    echo "✅ Database already contains seed data"
fi

echo ""
echo "🎯 Starting backend server..."
echo "================================"
echo ""

# Start the server
npm run dev
