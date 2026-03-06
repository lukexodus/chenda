#!/bin/bash

###############################################################################
# Chenda E2E Test Runner
#
# This script helps you run E2E tests with proper setup
#
# Usage:
#   ./run-e2e-tests.sh              # Run all tests
#   ./run-e2e-tests.sh --headed     # Run with visible browser
#   ./run-e2e-tests.sh --debug      # Run in debug mode
#   ./run-e2e-tests.sh --chrome     # Run Chrome only
#   ./run-e2e-tests.sh --firefox    # Run Firefox only
###############################################################################

set -e  # Exit on error

echo "=================================================="
echo "   Chenda E2E Test Runner"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse arguments
MODE="normal"
BROWSER="all"

while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      MODE="headed"
      shift
      ;;
    --debug)
      MODE="debug"
      shift
      ;;
    --chrome|--chromium)
      BROWSER="chromium"
      shift
      ;;
    --firefox)
      BROWSER="firefox"
      shift
      ;;
    --setup-only)
      MODE="setup-only"
      shift
      ;;
    --help)
      echo "Usage: ./run-e2e-tests.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --headed        Run tests with visible browser"
      echo "  --debug         Run tests in debug mode"
      echo "  --chrome        Run Chrome tests only"
      echo "  --firefox       Run Firefox tests only"
      echo "  --setup-only    Only setup database, don't run tests"
      echo "  --help          Show this help message"
      echo ""
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

# Check if servers are running
echo "🔍 Checking if servers are running..."
echo ""

BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend server is running (port 3001)${NC}"
  BACKEND_RUNNING=true
else
  echo -e "${YELLOW}⚠️  Backend server is NOT running (port 3001)${NC}"
fi

if curl -s http://localhost:3000 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Frontend server is running (port 3000)${NC}"
  FRONTEND_RUNNING=true
else
  echo -e "${YELLOW}⚠️  Frontend server is NOT running (port 3000)${NC}"
fi

echo ""

if [ "$BACKEND_RUNNING" = false ] || [ "$FRONTEND_RUNNING" = false ]; then
  echo -e "${RED}❌ ERROR: Both servers must be running!${NC}"
  echo ""
  echo "Start servers in separate terminals:"
  echo ""
  echo "  Terminal 1 (Backend):"
  echo "    cd server && npm start"
  echo ""
  echo "  Terminal 2 (Frontend):"
  echo "    cd chenda-frontend && npm run dev"
  echo ""
  exit 1
fi

# Setup test database
echo "🔧 Setting up test database..."
echo ""

npm run e2e:setup

if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Failed to setup test database${NC}"
  exit 1
fi

echo ""

# Exit if setup-only mode
if [ "$MODE" = "setup-only" ]; then
  echo -e "${GREEN}✅ Test database setup complete!${NC}"
  echo ""
  echo "You can now run tests with:"
  echo "  npm run e2e:test"
  echo ""
  exit 0
fi

# Run tests based on mode and browser
echo "🧪 Running E2E tests..."
echo ""

case $MODE in
  headed)
    if [ "$BROWSER" = "chromium" ]; then
      npm run e2e:test:chromium -- --headed
    elif [ "$BROWSER" = "firefox" ]; then
      npm run e2e:test:firefox -- --headed
    else
      npm run e2e:test:headed
    fi
    ;;
  debug)
    if [ "$BROWSER" = "chromium" ]; then
      npm run e2e:test:chromium -- --debug
    elif [ "$BROWSER" = "firefox" ]; then
      npm run e2e:test:firefox -- --debug
    else
      npm run e2e:test:debug
    fi
    ;;
  *)
    if [ "$BROWSER" = "chromium" ]; then
      npm run e2e:test:chromium
    elif [ "$BROWSER" = "firefox" ]; then
      npm run e2e:test:firefox
    else
      npm run e2e:test
    fi
    ;;
esac

TEST_EXIT_CODE=$?

echo ""

# Show results
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ All E2E tests passed!${NC}"
  echo ""
  echo "View detailed report:"
  echo "  npm run e2e:report"
  echo ""
else
  echo -e "${RED}❌ Some E2E tests failed${NC}"
  echo ""
  echo "View detailed report:"
  echo "  npm run e2e:report"
  echo ""
  echo "Debug tips:"
  echo "  - Run with --headed to see browser"
  echo "  - Run with --debug to step through tests"
  echo "  - Check e2e/test-results/ for screenshots and videos"
  echo ""
fi

exit $TEST_EXIT_CODE
