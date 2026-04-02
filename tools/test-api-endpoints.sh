#!/bin/bash

# Test script for new API endpoints
# Run this after starting the Countdown Timer app

API_URL="http://localhost:9999/api"

echo "🧪 Testing Countdown Timer API Endpoints"
echo "========================================"
echo ""

# Test health check
echo "1. Testing Health Check..."
curl -s "$API_URL/health" | jq '.status'
echo ""

# Test individual time setters
echo "2. Testing Set Hours to 1..."
curl -s -X POST "$API_URL/timer/hours/1" | jq '.message'
echo ""

echo "3. Testing Set Minutes to 30..."
curl -s -X POST "$API_URL/timer/minutes/30" | jq '.message'
echo ""

echo "4. Testing Set Seconds to 45..."
curl -s -X POST "$API_URL/timer/seconds/45" | jq '.message'
echo ""

# Test minute adjustments
echo "5. Testing Add Minute..."
curl -s -X POST "$API_URL/timer/add-minute" | jq '.message'
echo ""

echo "6. Testing Subtract Minute..."
curl -s -X POST "$API_URL/timer/subtract-minute" | jq '.message'
echo ""

# Test sound control
echo "7. Testing Mute Sound..."
curl -s -X POST "$API_URL/sound/mute" | jq '.message'
echo ""

echo "8. Testing Unmute Sound..."
curl -s -X POST "$API_URL/sound/unmute" | jq '.message'
echo ""

echo "9. Testing Toggle Sound..."
curl -s -X POST "$API_URL/sound/toggle" | jq '.message'
echo ""

# Test feature image
echo "10. Testing Toggle Feature Image..."
curl -s -X POST "$API_URL/display/toggle-feature-image" | jq '.message'
echo ""

echo "11. Testing Set Feature Image (enabled)..."
curl -s -X POST "$API_URL/display/feature-image" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq '.message'
echo ""

# Test layouts
echo "12. Testing Get Layouts..."
curl -s "$API_URL/layouts" | jq '.data'
echo ""

echo "13. Testing Set Layout to 'minimal'..."
curl -s -X POST "$API_URL/layout" \
  -H "Content-Type: application/json" \
  -d '{"layoutId": "minimal"}' | jq '.message'
echo ""

# Test messages
echo "14. Testing Send Message..."
curl -s -X POST "$API_URL/message" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test Message from API", "duration": 5000}' | jq '.message'
echo ""

echo "15. Testing Hide Message..."
curl -s -X POST "$API_URL/message/hide" | jq '.message'
echo ""

echo "16. Testing Toggle Message..."
curl -s -X POST "$API_URL/message/toggle" | jq '.message'
echo ""

# Test display flash
echo "17. Testing Display Flash..."
curl -s -X POST "$API_URL/display/flash" \
  -H "Content-Type: application/json" \
  -d '{"cycles": 3, "duration": 500}' | jq '.message'
echo ""

# Get current state to verify
echo "18. Getting Current Timer State..."
curl -s "$API_URL/timer/state" | jq '.data | {isRunning, isPaused, formattedTime}'
echo ""

echo "========================================"
echo "✅ API Endpoint Testing Complete!"
echo ""
echo "📝 Check the Countdown Timer app to verify visual changes"
echo "💡 All endpoints should return success: true"
