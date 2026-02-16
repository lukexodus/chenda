#!/bin/bash
# ============================================
# Chenda Backend Setup Script for Linux
# ============================================

set -e

echo ""
echo "============================================"
echo "   Chenda Backend Setup for Linux"
echo "============================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is installed
echo -e "${YELLOW}[1/6] Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}[ERROR] PostgreSQL not found!${NC}"
    echo ""
    echo "To install PostgreSQL on Ubuntu/Debian:"
    echo "  sudo apt update"
    echo "  sudo apt install postgresql postgresql-contrib postgis"
    echo ""
    echo "To install on CentOS/RHEL:"
    echo "  sudo dnf install postgresql-server postgis"
    echo "  sudo postgresql-setup --initdb"
    echo "  sudo systemctl start postgresql"
    echo ""
    exit 1
fi
echo -e "${GREEN}[OK] PostgreSQL found${NC}"
psql --version
echo ""

# Check if Node.js is installed
echo -e "${YELLOW}[2/6] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}[ERROR] Node.js not found!${NC}"
    echo ""
    echo "To install Node.js:"
    echo "  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "  sudo apt install -y nodejs"
    echo ""
    exit 1
fi
node --version
echo -e "${GREEN}[OK] Node.js found${NC}"
echo ""

# Setup .env file
echo -e "${YELLOW}[3/6] Setting up environment variables...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}[INFO] Created .env from .env.example${NC}"
        echo ""
        echo "IMPORTANT: Edit .env and set DB_PASSWORD"
        echo "Run: nano .env"
        echo ""
        read -p "Press Enter after you've edited .env..."
    else
        echo -e "${RED}[ERROR] .env.example not found!${NC}"
        exit 1
    fi
else
    echo -e "${GREEN}[OK] .env already exists${NC}"
fi
echo ""

# Install dependencies
echo -e "${YELLOW}[4/6] Installing dependencies...${NC}"
npm install
echo -e "${GREEN}[OK] Dependencies installed${NC}"
echo ""

# Create database
echo -e "${YELLOW}[5/6] Creating database...${NC}"
echo ""
echo "Creating 'chenda_db' database..."
echo "You may be prompted for PostgreSQL password."
echo ""
sudo -u postgres psql -c "CREATE DATABASE chenda_db;" 2>/dev/null || echo "[INFO] Database may already exist"
echo -e "${GREEN}[OK] Database ready${NC}"
echo ""

# Install PostGIS extension
echo -e "${YELLOW}[6/6] Enabling PostGIS extension...${NC}"
echo ""
sudo -u postgres psql -d chenda_db -c "CREATE EXTENSION IF NOT EXISTS postgis CASCADE;"
if [ $? -ne 0 ]; then
    echo ""
    echo -e "${YELLOW}[WARNING] PostGIS extension failed to enable${NC}"
    echo ""
    echo "To install PostGIS:"
    echo "  Ubuntu/Debian: sudo apt install postgis postgresql-15-postgis-3"
    echo "  CentOS/RHEL: sudo dnf install postgis"
    echo ""
fi
echo ""

echo "============================================"
echo "   Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "  1. Run migrations:  node migrations/migrate.js up"
echo "  2. Seed database:   node seeds/seed.js"
echo "  3. Start server:    cd server && npm run dev"
echo ""
