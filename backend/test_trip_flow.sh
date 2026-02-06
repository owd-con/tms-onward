#!/bin/bash

# ============================================
# TRIP CREATION, OPERATIONS, AND RESCHEDULE TEST
# ============================================

BASE_URL="http://localhost:8080"
TOKEN=""
CUSTOMER_ID=""
PICKUP_ADDR_ID=""
DELIVERY_ADDR_ID=""
DRIVER_ID=""
VEHICLE_ID=""
ORDER_ID=""
TRIP_ID=""
NEW_DRIVER_ID=""
NEW_VEHICLE_ID=""
FAILED_WAYPOINT_ID=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to print test result
print_result() {
    local test_name="$1"
    local status="$2"
    local status_code="$3"
    local response="$4"
    local expected="$5"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo ""
    echo "=========================================="
    echo "TEST: $test_name"
    echo "=========================================="
    echo "Status Code: $status_code"
    echo "Expected Status: $expected"

    if [ "$status_code" == "$expected" ]; then
        echo -e "${GREEN}✓ STATUS: PASS${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ STATUS: FAIL${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    echo ""
    echo "Response Body:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
}

# Function to extract value from JSON
extract_value() {
    echo "$1" | jq -r "$2" 2>/dev/null || echo ""
}

echo "=========================================="
echo "TRIP MANAGEMENT FLOW TEST"
echo "=========================================="
echo ""

# ============================================
# STEP 0: Register and Login
# ============================================
echo "STEP 0: Register and Login..."
echo "=========================================="

# Register
REGISTER_RESP=$(curl -s -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Trip Test Company",
    "name": "Trip Test User",
    "email": "triptest@example.com",
    "phone": "081234567890",
    "password": "Password123!",
    "confirm_password": "Password123!"
  }')

REGISTER_STATUS=$(extract_value "$REGISTER_RESP" '.success')
print_result "Register User" "$REGISTER_STATUS" "$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Trip Test Company 2",
    "name": "Trip Test User 2",
    "email": "triptest2@example.com",
    "phone": "081234567891",
    "password": "Password123!",
    "confirm_password": "Password123!"
  }')" "201" || true

# Login
LOGIN_RESP=$(curl -s -X POST ${BASE_URL}/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "triptest@example.com",
    "password": "Password123!"
  }')

TOKEN=$(extract_value "$LOGIN_RESP" '.data.token')

if [ -z "$TOKEN" ] || [ "$TOKEN" == "null" ]; then
    echo -e "${RED}Failed to get token. Exiting.${NC}"
    exit 1
fi

echo -e "${GREEN}Token obtained: ${TOKEN:0:20}...${NC}"
echo ""

# ============================================
# STEP 1: Create Test Data
# ============================================
echo "STEP 1: Create Test Data..."
echo "=========================================="

# Create Customer
CUSTOMER_RESP=$(curl -s -X POST ${BASE_URL}/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "PT Trip Customer",
    "email": "trip@customer.co.id",
    "phone": "08123456789"
  }')

CUSTOMER_ID=$(extract_value "$CUSTOMER_RESP" '.data.id')
CUSTOMER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/customers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "PT Trip Customer",
    "email": "trip@customer.co.id",
    "phone": "08123456789"
  }')

print_result "Create Customer" "success" "$CUSTOMER_STATUS" "$CUSTOMER_RESP" "201"

# Create Pickup Address
PICKUP_ADDR_RESP=$(curl -s -X POST ${BASE_URL}/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"name\": \"Pickup Loc\",
    \"address\": \"Jl Pickup No 1\",
    \"village_id\": \"1\",
    \"contact_name\": \"Agent A\",
    \"contact_phone\": \"08111111\"
  }")

PICKUP_ADDR_ID=$(extract_value "$PICKUP_ADDR_RESP" '.data.id')
PICKUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"name\": \"Pickup Loc\",
    \"address\": \"Jl Pickup No 1\",
    \"village_id\": \"1\",
    \"contact_name\": \"Agent A\",
    \"contact_phone\": \"08111111\"
  }")

print_result "Create Pickup Address" "success" "$PICKUP_STATUS" "$PICKUP_ADDR_RESP" "201"

# Create Delivery Address
DELIVERY_ADDR_RESP=$(curl -s -X POST ${BASE_URL}/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"name\": \"Delivery Loc\",
    \"address\": \"Jl Delivery No 2\",
    \"village_id\": \"2\",
    \"contact_name\": \"Agent B\",
    \"contact_phone\": \"08222222\"
  }")

DELIVERY_ADDR_ID=$(extract_value "$DELIVERY_ADDR_RESP" '.data.id')
DELIVERY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"name\": \"Delivery Loc\",
    \"address\": \"Jl Delivery No 2\",
    \"village_id\": \"2\",
    \"contact_name\": \"Agent B\",
    \"contact_phone\": \"08222222\"
  }")

print_result "Create Delivery Address" "success" "$DELIVERY_STATUS" "$DELIVERY_ADDR_RESP" "201"

# Create Driver
DRIVER_RESP=$(curl -s -X POST ${BASE_URL}/drivers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Driver 1",
    "license_number": "B 1111 TRIP",
    "license_type": "SIM_B1",
    "phone": "081111111",
    "address": "Driver Address 1"
  }')

DRIVER_ID=$(extract_value "$DRIVER_RESP" '.data.id')
DRIVER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/drivers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Driver 1",
    "license_number": "B 1111 TRIP",
    "license_type": "SIM_B1",
    "phone": "081111111",
    "address": "Driver Address 1"
  }')

print_result "Create Driver" "success" "$DRIVER_STATUS" "$DRIVER_RESP" "201"

# Create second driver for reschedule
DRIVER2_RESP=$(curl -s -X POST ${BASE_URL}/drivers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Driver 2",
    "license_number": "B 2222 TRIP",
    "license_type": "SIM_B1",
    "phone": "082222222",
    "address": "Driver Address 2"
  }')

NEW_DRIVER_ID=$(extract_value "$DRIVER2_RESP" '.data.id')
DRIVER2_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/drivers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Driver 2",
    "license_number": "B 2222 TRIP",
    "license_type": "SIM_B1",
    "phone": "082222222",
    "address": "Driver Address 2"
  }')

print_result "Create Second Driver (for reschedule)" "success" "$DRIVER2_STATUS" "$DRIVER2_RESP" "201"

# Create Vehicle
VEHICLE_RESP=$(curl -s -X POST ${BASE_URL}/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate_number": "B 1111 TEST",
    "type": "Truck",
    "capacity_weight": 5000,
    "capacity_volume": 10,
    "year": 2020,
    "make": "Hino",
    "model": "300"
  }')

VEHICLE_ID=$(extract_value "$VEHICLE_RESP" '.data.id')
VEHICLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate_number": "B 1111 TEST",
    "type": "Truck",
    "capacity_weight": 5000,
    "capacity_volume": 10,
    "year": 2020,
    "make": "Hino",
    "model": "300"
  }')

print_result "Create Vehicle" "success" "$VEHICLE_STATUS" "$VEHICLE_RESP" "201"

# Create second vehicle for reschedule
VEHICLE2_RESP=$(curl -s -X POST ${BASE_URL}/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate_number": "B 2222 TEST",
    "type": "Truck",
    "capacity_weight": 5000,
    "capacity_volume": 10,
    "year": 2020,
    "make": "Hino",
    "model": "300"
  }')

NEW_VEHICLE_ID=$(extract_value "$VEHICLE2_RESP" '.data.id')
VEHICLE2_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "plate_number": "B 2222 TEST",
    "type": "Truck",
    "capacity_weight": 5000,
    "capacity_volume": 10,
    "year": 2020,
    "make": "Hino",
    "model": "300"
  }')

print_result "Create Second Vehicle (for reschedule)" "success" "$VEHICLE2_STATUS" "$VEHICLE2_RESP" "201"

# ============================================
# STEP 2: Create Order
# ============================================
echo ""
echo "STEP 2: Create Order..."
echo "=========================================="

ORDER_RESP=$(curl -s -X POST ${BASE_URL}/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"order_type\": \"FTL\",
    \"reference_code\": \"TRIP-TEST-001\",
    \"order_waypoints\": [
      {
        \"type\": \"Pickup\",
        \"address_id\": \"$PICKUP_ADDR_ID\",
        \"scheduled_date\": \"2026-01-26\"
      },
      {
        \"type\": \"Delivery\",
        \"address_id\": \"$DELIVERY_ADDR_ID\",
        \"scheduled_date\": \"2026-01-26\"
      }
    ]
  }")

ORDER_ID=$(extract_value "$ORDER_RESP" '.data.id')
ORDER_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"order_type\": \"FTL\",
    \"reference_code\": \"TRIP-TEST-001\",
    \"order_waypoints\": [
      {
        \"type\": \"Pickup\",
        \"address_id\": \"$PICKUP_ADDR_ID\",
        \"scheduled_date\": \"2026-01-26\"
      },
      {
        \"type\": \"Delivery\",
        \"address_id\": \"$DELIVERY_ADDR_ID\",
        \"scheduled_date\": \"2026-01-26\"
      }
    ]
  }")

print_result "Create Order with Waypoints" "success" "$ORDER_STATUS" "$ORDER_RESP" "201"

# Get order waypoints
ORDER_DETAIL=$(curl -s -X GET "${BASE_URL}/orders/${ORDER_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo ""
echo "Order Detail with Waypoints:"
echo "$ORDER_DETAIL" | jq '.data.waypoints'

# ============================================
# PHASE 12: Trip Management Operations
# ============================================
echo ""
echo "=========================================="
echo "PHASE 12: TRIP MANAGEMENT OPERATIONS"
echo "=========================================="

# Test 1: Create Trip
echo ""
echo "Test 1: Create Trip"
echo "=========================================="
CREATE_TRIP_RESP=$(curl -s -X POST ${BASE_URL}/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"order_id\": \"$ORDER_ID\",
    \"driver_id\": \"$DRIVER_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"notes\": \"Test trip creation\"
  }")

TRIP_ID=$(extract_value "$CREATE_TRIP_RESP" '.data.id')
CREATE_TRIP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"order_id\": \"$ORDER_ID\",
    \"driver_id\": \"$DRIVER_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"notes\": \"Test trip creation\"
  }")

print_result "Create Trip" "success" "$CREATE_TRIP_STATUS" "$CREATE_TRIP_RESP" "201"

# Test 2: List Trips
echo ""
echo "Test 2: List Trips"
echo "=========================================="
LIST_TRIPS_RESP=$(curl -s -X GET ${BASE_URL}/trips \
  -H "Authorization: Bearer $TOKEN")
LIST_TRIPS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET ${BASE_URL}/trips \
  -H "Authorization: Bearer $TOKEN")

print_result "List Trips" "success" "$LIST_TRIPS_STATUS" "$LIST_TRIPS_RESP" "200"

# Test 3: Get Trip Detail
echo ""
echo "Test 3: Get Trip Detail (check for waypoints)"
echo "=========================================="
TRIP_DETAIL_RESP=$(curl -s -X GET "${BASE_URL}/trips/${TRIP_ID}" \
  -H "Authorization: Bearer $TOKEN")
TRIP_DETAIL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${BASE_URL}/trips/${TRIP_ID}" \
  -H "Authorization: Bearer $TOKEN")

print_result "Get Trip Detail" "success" "$TRIP_DETAIL_STATUS" "$TRIP_DETAIL_RESP" "200"

# Check if waypoints array exists
WAYPOINTS_COUNT=$(echo "$TRIP_DETAIL_RESP" | jq '.data.waypoints | length' 2>/dev/null || echo "0")
echo ""
echo -e "${YELLOW}Waypoints in trip response: $WAYPOINTS_COUNT${NC}"
if [ "$WAYPOINTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓ Waypoints array is present (Blueprint v2.7)${NC}"
else
    echo -e "${RED}✗ Waypoints array is missing${NC}"
fi

# Test 4: Start Trip
echo ""
echo "Test 4: Start Trip"
echo "=========================================="
START_TRIP_RESP=$(curl -s -X POST "${BASE_URL}/trips/${TRIP_ID}/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")
START_TRIP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/trips/${TRIP_ID}/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

print_result "Start Trip" "success" "$START_TRIP_STATUS" "$START_TRIP_RESP" "200"

# Verify trip status after start
TRIP_AFTER_START=$(curl -s -X GET "${BASE_URL}/trips/${TRIP_ID}" \
  -H "Authorization: Bearer $TOKEN")
TRIP_STATUS_AFTER_START=$(extract_value "$TRIP_AFTER_START" '.data.status')
echo ""
echo "Trip Status after start: $TRIP_STATUS_AFTER_START"

# Test 5: Complete Trip
echo ""
echo "Test 5: Complete Trip"
echo "=========================================="
COMPLETE_TRIP_RESP=$(curl -s -X POST "${BASE_URL}/trips/${TRIP_ID}/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")
COMPLETE_TRIP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/trips/${TRIP_ID}/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

print_result "Complete Trip" "success" "$COMPLETE_TRIP_STATUS" "$COMPLETE_TRIP_RESP" "200"

# Verify trip status after complete
TRIP_AFTER_COMPLETE=$(curl -s -X GET "${BASE_URL}/trips/${TRIP_ID}" \
  -H "Authorization: Bearer $TOKEN")
TRIP_STATUS_AFTER_COMPLETE=$(extract_value "$TRIP_AFTER_COMPLETE" '.data.status')
echo ""
echo "Trip Status after complete: $TRIP_STATUS_AFTER_COMPLETE"

# ============================================
# PHASE 12.1: TripWaypoint Updates
# ============================================
echo ""
echo "=========================================="
echo "PHASE 12.1: TRIP WAYPOINT UPDATES"
echo "=========================================="

# Create a new order and trip for waypoint testing
echo ""
echo "Creating new order for waypoint testing..."
ORDER2_RESP=$(curl -s -X POST ${BASE_URL}/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"order_type\": \"FTL\",
    \"reference_code\": \"WAYPOINT-TEST-001\",
    \"order_waypoints\": [
      {
        \"type\": \"Pickup\",
        \"address_id\": \"$PICKUP_ADDR_ID\",
        \"scheduled_date\": \"2026-01-27\"
      },
      {
        \"type\": \"Delivery\",
        \"address_id\": \"$DELIVERY_ADDR_ID\",
        \"scheduled_date\": \"2026-01-27\"
      }
    ]
  }")

ORDER2_ID=$(extract_value "$ORDER2_RESP" '.data.id')
echo "Order 2 created: $ORDER2_ID"

# Create trip for order 2
TRIP2_RESP=$(curl -s -X POST ${BASE_URL}/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"order_id\": \"$ORDER2_ID\",
    \"driver_id\": \"$DRIVER_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"notes\": \"Test waypoint updates\"
  }")

TRIP2_ID=$(extract_value "$TRIP2_RESP" '.data.id')
echo "Trip 2 created: $TRIP2_ID"

# Test 6: Verify Trip Detail includes waypoints
echo ""
echo "Test 6: Verify Trip Detail includes waypoints"
echo "=========================================="
TRIP2_DETAIL=$(curl -s -X GET "${BASE_URL}/trips/${TRIP2_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo "$TRIP2_DETAIL" | jq '.data.waypoints'

WAYPOINTS_IN_TRIP=$(echo "$TRIP2_DETAIL" | jq '.data.waypoints // []')
WP1_ID=$(echo "$WAYPOINTS_IN_TRIP" | jq '.[0].order_waypoint_id // empty')
WP2_ID=$(echo "$WAYPOINTS_IN_TRIP" | jq '.[1].order_waypoint_id // empty')

echo ""
echo "Waypoint 1 Order Waypoint ID: $WP1_ID"
echo "Waypoint 2 Order Waypoint ID: $WP2_ID"

# Test 7: Update Waypoint Sequence
echo ""
echo "Test 7: Update Waypoint Sequence"
echo "=========================================="

if [ -n "$WP1_ID" ] && [ -n "$WP2_ID" ]; then
    UPDATE_WAYPOINT_RESP=$(curl -s -X PUT "${BASE_URL}/trips/${TRIP2_ID}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"waypoints\": [
          {\"order_waypoint_id\": \"$WP1_ID\", \"sequence_number\": 1},
          {\"order_waypoint_id\": \"$WP2_ID\", \"sequence_number\": 2}
        ]
      }")
    UPDATE_WAYPOINT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "${BASE_URL}/trips/${TRIP2_ID}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"waypoints\": [
          {\"order_waypoint_id\": \"$WP1_ID\", \"sequence_number\": 1},
          {\"order_waypoint_id\": \"$WP2_ID\", \"sequence_number\": 2}
        ]
      }")

    print_result "Update Waypoint Sequence" "success" "$UPDATE_WAYPOINT_STATUS" "$UPDATE_WAYPOINT_RESP" "200"
else
    echo -e "${RED}✗ Skipping waypoint update test - waypoint IDs not found${NC}"
fi

# ============================================
# PHASE 16: Reschedule Flow
# ============================================
echo ""
echo "=========================================="
echo "PHASE 16: RESCHEDULE FLOW"
echo "=========================================="

# Test 8: Create scenario for reschedule
echo ""
echo "Test 8: Create reschedule scenario"
echo "=========================================="

# Create order with 2+ waypoints for reschedule
ORDER3_RESP=$(curl -s -X POST ${BASE_URL}/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"order_type\": \"FTL\",
    \"reference_code\": \"RESCHEDULE-TEST-001\",
    \"order_waypoints\": [
      {
        \"type\": \"Pickup\",
        \"address_id\": \"$PICKUP_ADDR_ID\",
        \"scheduled_date\": \"2026-01-28\"
      },
      {
        \"type\": \"Delivery\",
        \"address_id\": \"$DELIVERY_ADDR_ID\",
        \"scheduled_date\": \"2026-01-28\"
      }
    ]
  }")

ORDER3_ID=$(extract_value "$ORDER3_RESP" '.data.id')
ORDER3_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"customer_id\": \"$CUSTOMER_ID\",
    \"order_type\": \"FTL\",
    \"reference_code\": \"RESCHEDULE-TEST-001\",
    \"order_waypoints\": [
      {
        \"type\": \"Pickup\",
        \"address_id\": \"$PICKUP_ADDR_ID\",
        \"scheduled_date\": \"2026-01-28\"
      },
      {
        \"type\": \"Delivery\",
        \"address_id\": \"$DELIVERY_ADDR_ID\",
        \"scheduled_date\": \"2026-01-28\"
      }
    ]
  }")

print_result "Create Order for Reschedule" "success" "$ORDER3_STATUS" "$ORDER3_RESP" "201"

# Create trip for order 3
TRIP3_RESP=$(curl -s -X POST ${BASE_URL}/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"order_id\": \"$ORDER3_ID\",
    \"driver_id\": \"$DRIVER_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"notes\": \"Trip to be rescheduled\"
  }")

TRIP3_ID=$(extract_value "$TRIP3_RESP" '.data.id')
TRIP3_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"order_id\": \"$ORDER3_ID\",
    \"driver_id\": \"$DRIVER_ID\",
    \"vehicle_id\": \"$VEHICLE_ID\",
    \"notes\": \"Trip to be rescheduled\"
  }")

print_result "Create Trip for Reschedule" "success" "$TRIP3_STATUS" "$TRIP3_RESP" "201"

# Start trip 3
echo ""
echo "Starting trip for reschedule scenario..."
START_TRIP3_RESP=$(curl -s -X POST "${BASE_URL}/trips/${TRIP3_ID}/start" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN")

# Get trip waypoints
TRIP3_DETAIL=$(curl -s -X GET "${BASE_URL}/trips/${TRIP3_ID}" \
  -H "Authorization: Bearer $TOKEN")

echo "Trip 3 detail before waypoint operations:"
echo "$TRIP3_DETAIL" | jq '.data.waypoints'

# Get waypoint IDs from trip
TRIP3_WAYPOINTS=$(echo "$TRIP3_DETAIL" | jq '.data.waypoints')
WAYPOINT1_ID=$(echo "$TRIP3_WAYPOINTS" | jq -r '.[0].id // empty')
WAYPOINT2_ID=$(echo "$TRIP3_WAYPOINTS" | jq -r '.[1].id // empty')

echo ""
echo "Waypoint 1 ID: $WAYPOINT1_ID"
echo "Waypoint 2 ID: $WAYPOINT2_ID"

# Mark first waypoint as completed (if endpoint exists)
echo ""
echo "Marking first waypoint as completed..."

# Try to use the waypoint update endpoint
if [ -n "$WAYPOINT1_ID" ]; then
    UPDATE_WP1_RESP=$(curl -s -X PUT "${BASE_URL}/trips/${TRIP3_ID}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"waypoints\": [
          {\"id\": \"$WAYPOINT1_ID\", \"status\": \"Completed\"}
        ]
      }")
    echo "Waypoint 1 update response:"
    echo "$UPDATE_WP1_RESP" | jq '.'
fi

# Mark second waypoint as Failed
echo ""
echo "Marking second waypoint as Failed..."

if [ -n "$WAYPOINT2_ID" ]; then
    FAILED_WAYPOINT_ID="$WAYPOINT2_ID"
    UPDATE_WP2_RESP=$(curl -s -X PUT "${BASE_URL}/trips/${TRIP3_ID}" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"waypoints\": [
          {\"id\": \"$WAYPOINT2_ID\", \"status\": \"Failed\"}
        ]
      }")
    echo "Waypoint 2 update response:"
    echo "$UPDATE_WP2_RESP" | jq '.'
fi

# Test 9: Test Reschedule API
echo ""
echo "Test 9: Batch Reschedule Failed Waypoints"
echo "=========================================="

if [ -n "$FAILED_WAYPOINT_ID" ] && [ -n "$ORDER3_ID" ]; then
    RESCHEDULE_RESP=$(curl -s -X POST ${BASE_URL}/exceptions/waypoints/batch-reschedule \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"order_id\": \"$ORDER3_ID\",
        \"waypoint_ids\": [\"$FAILED_WAYPOINT_ID\"],
        \"driver_id\": \"$NEW_DRIVER_ID\",
        \"vehicle_id\": \"$NEW_VEHICLE_ID\",
        \"notes\": \"Rescheduling failed waypoint\"
      }")
    RESCHEDULE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST ${BASE_URL}/exceptions/waypoints/batch-reschedule \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "{
        \"order_id\": \"$ORDER3_ID\",
        \"waypoint_ids\": [\"$FAILED_WAYPOINT_ID\"],
        \"driver_id\": \"$NEW_DRIVER_ID\",
        \"vehicle_id\": \"$NEW_VEHICLE_ID\",
        \"notes\": \"Rescheduling failed waypoint\"
      }")

    print_result "Batch Reschedule Waypoints" "success" "$RESCHEDULE_STATUS" "$RESCHEDULE_RESP" "200"

    # Extract new trip ID from response
    NEW_TRIP_ID=$(extract_value "$RESCHEDULE_RESP" '.data.new_trip.id // empty')
    echo ""
    echo "New Trip ID from reschedule: $NEW_TRIP_ID"

    # Test 10: Verify after reschedule
    echo ""
    echo "Test 10: Verify After Reschedule"
    echo "=========================================="

    # Check old trip status
    OLD_TRIP_AFTER=$(curl -s -X GET "${BASE_URL}/trips/${TRIP3_ID}" \
      -H "Authorization: Bearer $TOKEN")
    OLD_TRIP_STATUS=$(extract_value "$OLD_TRIP_AFTER" '.data.status')

    echo "Old Trip Status: $OLD_TRIP_STATUS"
    if [ "$OLD_TRIP_STATUS" == "Completed" ]; then
        echo -e "${GREEN}✓ Old trip marked as Completed${NC}"
    else
        echo -e "${RED}✗ Old trip NOT marked as Completed (current: $OLD_TRIP_STATUS)${NC}"
    fi

    # Check new trip created
    if [ -n "$NEW_TRIP_ID" ] && [ "$NEW_TRIP_ID" != "null" ] && [ "$NEW_TRIP_ID" != "" ]; then
        echo -e "${GREEN}✓ New trip created: $NEW_TRIP_ID${NC}"

        NEW_TRIP_DETAIL=$(curl -s -X GET "${BASE_URL}/trips/${NEW_TRIP_ID}" \
          -H "Authorization: Bearer $TOKEN")
        echo "New Trip Detail:"
        echo "$NEW_TRIP_DETAIL" | jq '.'
    else
        echo -e "${RED}✗ New trip NOT created${NC}"
    fi

    # Check waypoints reset to Pending
    if [ -n "$NEW_TRIP_ID" ]; then
        NEW_TRIP_WAYPOINTS=$(curl -s -X GET "${BASE_URL}/trips/${NEW_TRIP_ID}" \
          -H "Authorization: Bearer $TOKEN" | jq '.data.waypoints')
        echo ""
        echo "New Trip Waypoints:"
        echo "$NEW_TRIP_WAYPOINTS"

        WP_RESET_COUNT=$(echo "$NEW_TRIP_WAYPOINTS" | jq '[.[] | select(.status == "Pending")] | length')
        echo ""
        echo "Waypoints reset to Pending: $WP_RESET_COUNT"
        if [ "$WP_RESET_COUNT" -gt 0 ]; then
            echo -e "${GREEN}✓ Waypoints reset to Pending${NC}"
        else
            echo -e "${RED}✗ Waypoints NOT reset to Pending${NC}"
        fi
    fi
else
    echo -e "${RED}✗ Skipping reschedule test - failed waypoint ID not found${NC}"
fi

# ============================================
# FINAL SUMMARY
# ============================================
echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED${NC}"
    exit 1
fi
