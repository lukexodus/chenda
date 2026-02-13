#!/bin/bash

# Quick Test for User Management API

BASE_URL="http://localhost:3001/api"
COOKIE_FILE="/tmp/chenda_quick_test.txt"

echo "Quick Test: User Management API"
echo ""

# Login
echo "1. Login..."
curl -s -c $COOKIE_FILE -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "maria.santos@email.com", "password": "password123"}' | grep -o '"success":true' && echo "✅ Login OK" || echo "❌ Login failed"

# Get Profile
echo "2. Get Profile..."
curl -s -b $COOKIE_FILE "$BASE_URL/users/profile" | grep -o '"success":true' && echo "✅ Get Profile OK" || echo "❌ Get Profile failed"

# Update Profile
echo "3. Update Profile..."
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -d '{"name": "Maria Test"}' | grep -o '"success":true' && echo "✅ Update Profile OK" || echo "❌ Update Profile failed"

# Update Preferences (valid)
echo "4. Update Preferences (valid)..."
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/preferences" \
  -H "Content-Type: application/json" \
  -d '{"proximity_weight": 70, "freshness_weight": 30}' | grep -o '"success":true' && echo "✅ Update Preferences OK" || echo "❌ Update Preferences failed"

# Update Preferences (invalid - should fail)
echo "5. Update Preferences (invalid - should fail)..."
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/preferences" \
  -H "Content-Type: application/json" \
  -d '{"proximity_weight": 60, "freshness_weight": 30}' | grep -o '"success":false' && echo "✅ Validation OK (correctly rejected)" || echo "❌ Validation failed"

# Update Location (coordinates)
echo "6. Update Location (coordinates)..."
curl -s -b $COOKIE_FILE -X PUT "$BASE_URL/users/location" \
  -H "Content-Type: application/json" \
  -d '{"lat": 14.5500, "lng": 121.0000}' | grep -o '"success":true' && echo "✅ Update Location OK" || echo "❌ Update Location failed"

sleep 2  # Rate limit

# Geocode
echo "7. Geocode Address..."
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/users/geocode" \
  -H "Content-Type: application/json" \
  -d '{"address": "Manila, Philippines"}' | grep -o '"success":true' && echo "✅ Geocode OK" || echo "❌ Geocode failed"

sleep 2  # Rate limit

# Reverse Geocode
echo "8. Reverse Geocode..."
curl -s -b $COOKIE_FILE -X POST "$BASE_URL/users/reverse-geocode" \
  -H "Content-Type: application/json" \
  -d '{"lat": 14.5995, "lng": 120.9842}' | grep -o '"success":true' && echo "✅ Reverse Geocode OK" || echo "❌ Reverse Geocode failed"

# Cleanup
rm -f $COOKIE_FILE

echo ""
echo "✅ All tests completed!"
