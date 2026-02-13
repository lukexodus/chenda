#!/bin/bash

# Test User Management API Endpoints
# Task 1.6 Testing Script

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing User Management API (Task 1.6)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BASE_URL="http://localhost:3001/api"
COOKIE_FILE="/tmp/chenda_test_cookies.txt"

# Clean up old cookie file
rm -f $COOKIE_FILE

# Test 1: Login to get session
echo "📝 Test 1: Login to get session"
echo "POST $BASE_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -c $COOKIE_FILE -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "maria.santos@email.com",
    "password": "password123"
  }')

echo "$LOGIN_RESPONSE" | head -20
echo ""

# Extract user from login response
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$USER_ID" ]; then
  echo "❌ Login failed! Cannot proceed with tests."
  exit 1
fi

echo "✅ Login successful! User ID: $USER_ID"
echo ""
sleep 1

# Test 2: Get Profile
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 2: Get User Profile"
echo "GET $BASE_URL/users/profile"
PROFILE_RESPONSE=$(curl -s -b $COOKIE_FILE "$BASE_URL/users/profile")
echo "$PROFILE_RESPONSE" | head -30
echo ""
sleep 1

# Test 3: Update Profile
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 3: Update Profile (name)"
echo "PUT $BASE_URL/users/profile"
UPDATE_PROFILE=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos Updated"
  }')
echo "$UPDATE_PROFILE" | head -20
echo ""
sleep 1

# Test 4: Update Preferences (valid - weights sum to 100)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 4: Update Preferences (valid)"
echo "PUT $BASE_URL/users/preferences"
UPDATE_PREFS=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "proximity_weight": 70,
    "freshness_weight": 30,
    "max_radius": 25,
    "min_freshness": 50
  }')
echo "$UPDATE_PREFS" | head -20
echo ""
sleep 1

# Test 5: Update Preferences (invalid - weights don't sum to 100)
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 5: Update Preferences (invalid - weights don't sum to 100)"
echo "PUT $BASE_URL/users/preferences"
INVALID_PREFS=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/preferences" \
  -H "Content-Type: application/json" \
  -d '{
    "proximity_weight": 60,
    "freshness_weight": 30
  }')
echo "$INVALID_PREFS" | head -10
echo ""
sleep 1

# Test 6: Geocode Address
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 6: Geocode Address"
echo "POST $BASE_URL/users/geocode"
GEOCODE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/users/geocode" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Quezon City, Metro Manila, Philippines"
  }')
echo "$GEOCODE" | head -20
echo ""
sleep 2  # Wait for rate limit

# Test 7: Reverse Geocode
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 7: Reverse Geocode"
echo "POST $BASE_URL/users/reverse-geocode"
REVERSE=$(curl -s -b $COOKIE_FILE -X POST "$BASE_URL/users/reverse-geocode" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 14.5995,
    "lng": 120.9842
  }')
echo "$REVERSE" | head -15
echo ""
sleep 2  # Wait for rate limit

# Test 8: Update Location by Coordinates
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 8: Update Location (by coordinates)"
echo "PUT $BASE_URL/users/location"
UPDATE_LOC_COORDS=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/location" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 14.5500,
    "lng": 121.0000,
    "address": "Makati City, Metro Manila"
  }')
echo "$UPDATE_LOC_COORDS" | head -15
echo ""
sleep 2  # Wait for rate limit

# Test 9: Update Location by Address
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 9: Update Location (by address with geocoding)"
echo "PUT $BASE_URL/users/location"
UPDATE_LOC_ADDR=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/location" \
  -H "Content-Type: application/json" \
  -d '{
    "address": "Manila City Hall, Manila, Philippines"
  }')
echo "$UPDATE_LOC_ADDR" | head -15
echo ""
sleep 2  # Wait for rate limit

# Test 10: Validation - Invalid Coordinates
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 10: Validation - Invalid Coordinates (lat > 90)"
echo "PUT $BASE_URL/users/location"
INVALID_COORDS=$(curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/location" \
  -H "Content-Type: application/json" \
  -d '{
    "lat": 95,
    "lng": 120
  }')
echo "$INVALID_COORDS" | head -10
echo ""

# Test 11: Unauthenticated Request
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Test 11: Unauthenticated Request (should fail)"
echo "GET $BASE_URL/users/profile (without cookies)"
UNAUTH=$(curl -s "$BASE_URL/users/profile")
echo "$UNAUTH" | head -10
echo ""

# Clean up
rm -f $COOKIE_FILE

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ All tests completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
