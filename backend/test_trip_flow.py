#!/usr/bin/env python3
"""
Trip Creation, Operations, and Reschedule Flow Test
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "http://localhost:8080"
TOKEN = ""
TEST_DATA = {}

# Colors for output
class Colors:
    GREEN = '\033[0;32m'
    RED = '\033[0;31m'
    YELLOW = '\033[1;33m'
    NC = '\033[0m'

# Test counters
total_tests = 0
passed_tests = 0
failed_tests = 0


def print_result(test_name: str, success: bool, status_code: int, expected_status: int,
                 response: Dict[str, Any], details: str = ""):
    """Print test result"""
    global total_tests, passed_tests, failed_tests

    total_tests += 1

    print("\n" + "=" * 50)
    print(f"TEST: {test_name}")
    print("=" * 50)
    print(f"Status Code: {status_code}")
    print(f"Expected Status: {expected_status}")

    if status_code == expected_status:
        print(f"{Colors.GREEN}✓ STATUS: PASS{Colors.NC}")
        passed_tests += 1
    else:
        print(f"{Colors.RED}✗ STATUS: FAIL{Colors.NC}")
        failed_tests += 1

    print("\nResponse Body:")
    print(json.dumps(response, indent=2))

    if details:
        print(f"\nDetails: {details}")


def extract_value(data: Dict[str, Any], path: str) -> Any:
    """Extract value from nested dict using dot notation"""
    keys = path.split('.')
    value = data
    for key in keys:
        if isinstance(value, dict):
            value = value.get(key)
        else:
            return None
    return value


def api_call(method: str, endpoint: str, token: str = "", data: Dict = None,
             expected_status: int = 200, test_name: str = "") -> Optional[Dict]:
    """Make API call and return response"""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}

    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method.upper() == "GET":
            response = requests.get(url, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, headers=headers, json=data)
        elif method.upper() == "PUT":
            response = requests.put(url, headers=headers, json=data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, headers=headers)
        else:
            print(f"Unknown method: {method}")
            return None

        try:
            response_data = response.json()
        except:
            response_data = {"raw_response": response.text}

        if test_name:
            print_result(test_name, response.status_code == expected_status,
                        response.status_code, expected_status, response_data)

        return response_data

    except Exception as e:
        print(f"{Colors.RED}API call failed: {e}{Colors.NC}")
        return None


def main():
    global TOKEN

    print("=" * 50)
    print("TRIP MANAGEMENT FLOW TEST")
    print("=" * 50)

    # ============================================
    # STEP 0: Register and Login
    # ============================================
    print("\nSTEP 0: Register and Login...")
    print("=" * 50)

    # Register
    register_data = {
        "company_name": "Trip Test Company",
        "company_type": "3PL",
        "name": "Trip Test User",
        "email": "triptest@example.com",
        "phone": "081234567890",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "timezone": "Asia/Jakarta",
        "currency": "IDR",
        "language": "id"
    }

    register_resp = api_call("POST", "/auth/register", data=register_data,
                            expected_status=200, test_name="Register User")

    # Login
    login_data = {
        "email": "triptest@example.com",
        "password": "Password123!"
    }

    login_resp = api_call("POST", "/auth/login", data=login_data,
                         expected_status=200, test_name="Login")

    # Try both token formats (token or access_token)
    TOKEN = extract_value(login_resp or {}, "data.token")
    if not TOKEN or TOKEN == "null":
        TOKEN = extract_value(login_resp or {}, "data.access_token")

    if not TOKEN or TOKEN == "null":
        print(f"{Colors.RED}Failed to get token. Exiting.{Colors.NC}")
        sys.exit(1)

    print(f"{Colors.GREEN}Token obtained: {TOKEN[:20]}...{Colors.NC}\n")

    # ============================================
    # STEP 1: Create Test Data
    # ============================================
    print("\nSTEP 1: Create Test Data...")
    print("=" * 50)

    # Create Customer
    customer_data = {
        "name": "PT Trip Customer",
        "email": "trip@customer.co.id",
        "phone": "08123456789"
    }

    customer_resp = api_call("POST", "/customers", TOKEN, customer_data,
                            expected_status=201, test_name="Create Customer")
    TEST_DATA["customer_id"] = extract_value(customer_resp or {}, "data.id")

    # Create Pickup Address
    pickup_addr_data = {
        "customer_id": TEST_DATA["customer_id"],
        "name": "Pickup Loc",
        "address": "Jl Pickup No 1",
        "village_id": "1",
        "contact_name": "Agent A",
        "contact_phone": "08111111"
    }

    pickup_resp = api_call("POST", "/addresses", TOKEN, pickup_addr_data,
                          expected_status=201, test_name="Create Pickup Address")
    TEST_DATA["pickup_addr_id"] = extract_value(pickup_resp or {}, "data.id")

    # Create Delivery Address
    delivery_addr_data = {
        "customer_id": TEST_DATA["customer_id"],
        "name": "Delivery Loc",
        "address": "Jl Delivery No 2",
        "village_id": "2",
        "contact_name": "Agent B",
        "contact_phone": "08222222"
    }

    delivery_resp = api_call("POST", "/addresses", TOKEN, delivery_addr_data,
                           expected_status=201, test_name="Create Delivery Address")
    TEST_DATA["delivery_addr_id"] = extract_value(delivery_resp or {}, "data.id")

    # Create Driver
    driver_data = {
        "name": "Test Driver 1",
        "license_number": "B 1111 TRIP",
        "license_type": "SIM_B1",
        "phone": "081111111",
        "address": "Driver Address 1"
    }

    driver_resp = api_call("POST", "/drivers", TOKEN, driver_data,
                          expected_status=201, test_name="Create Driver")
    TEST_DATA["driver_id"] = extract_value(driver_resp or {}, "data.id")

    # Create second driver for reschedule
    driver2_data = {
        "name": "Test Driver 2",
        "license_number": "B 2222 TRIP",
        "license_type": "SIM_B1",
        "phone": "082222222",
        "address": "Driver Address 2"
    }

    driver2_resp = api_call("POST", "/drivers", TOKEN, driver2_data,
                           expected_status=201, test_name="Create Second Driver")
    TEST_DATA["new_driver_id"] = extract_value(driver2_resp or {}, "data.id")

    # Create Vehicle
    vehicle_data = {
        "plate_number": "B 1111 TEST",
        "type": "Truck",
        "capacity_weight": 5000,
        "capacity_volume": 10,
        "year": 2020,
        "make": "Hino",
        "model": "300"
    }

    vehicle_resp = api_call("POST", "/vehicles", TOKEN, vehicle_data,
                           expected_status=201, test_name="Create Vehicle")
    TEST_DATA["vehicle_id"] = extract_value(vehicle_resp or {}, "data.id")

    # Create second vehicle for reschedule
    vehicle2_data = {
        "plate_number": "B 2222 TEST",
        "type": "Truck",
        "capacity_weight": 5000,
        "capacity_volume": 10,
        "year": 2020,
        "make": "Hino",
        "model": "300"
    }

    vehicle2_resp = api_call("POST", "/vehicles", TOKEN, vehicle2_data,
                            expected_status=201, test_name="Create Second Vehicle")
    TEST_DATA["new_vehicle_id"] = extract_value(vehicle2_resp or {}, "data.id")

    # ============================================
    # STEP 2: Create Order
    # ============================================
    print("\nSTEP 2: Create Order...")
    print("=" * 50)

    order_data = {
        "customer_id": TEST_DATA["customer_id"],
        "order_type": "FTL",
        "reference_code": "TRIP-TEST-001",
        "order_waypoints": [
            {
                "type": "Pickup",
                "address_id": TEST_DATA["pickup_addr_id"],
                "scheduled_date": "2026-01-26"
            },
            {
                "type": "Delivery",
                "address_id": TEST_DATA["delivery_addr_id"],
                "scheduled_date": "2026-01-26"
            }
        ]
    }

    order_resp = api_call("POST", "/orders", TOKEN, order_data,
                         expected_status=201, test_name="Create Order")
    TEST_DATA["order_id"] = extract_value(order_resp or {}, "data.id")

    # Get order detail to verify waypoints
    order_detail = api_call("GET", f"/orders/{TEST_DATA['order_id']}", TOKEN,
                           expected_status=200, test_name="Get Order Detail")
    print(f"\nOrder Waypoints: {json.dumps(extract_value(order_detail or {}, 'data.waypoints'), indent=2)}")

    # ============================================
    # PHASE 12: Trip Management Operations
    # ============================================
    print("\n" + "=" * 50)
    print("PHASE 12: TRIP MANAGEMENT OPERATIONS")
    print("=" * 50)

    # Test 1: Create Trip
    trip_data = {
        "order_id": TEST_DATA["order_id"],
        "driver_id": TEST_DATA["driver_id"],
        "vehicle_id": TEST_DATA["vehicle_id"],
        "notes": "Test trip creation"
    }

    trip_resp = api_call("POST", "/trips", TOKEN, trip_data,
                        expected_status=201, test_name="Create Trip")
    TEST_DATA["trip_id"] = extract_value(trip_resp or {}, "data.id")

    # Test 2: List Trips
    list_trips_resp = api_call("GET", "/trips", TOKEN,
                              expected_status=200, test_name="List Trips")

    # Test 3: Get Trip Detail
    trip_detail = api_call("GET", f"/trips/{TEST_DATA['trip_id']}", TOKEN,
                          expected_status=200, test_name="Get Trip Detail")

    waypoints = extract_value(trip_detail or {}, "data.waypoints")
    waypoints_count = len(waypoints) if waypoints else 0
    details = f"Waypoints in trip: {waypoints_count}"
    if waypoints_count > 0:
        details += f" {Colors.GREEN}✓ Blueprint v2.7 compliant{Colors.NC}"
    else:
        details += f" {Colors.RED}✗ Waypoints missing{Colors.NC}"
    print(f"\n{details}")

    # Test 4: Start Trip
    start_trip_resp = api_call("POST", f"/trips/{TEST_DATA['trip_id']}/start", TOKEN,
                              expected_status=200, test_name="Start Trip")

    # Verify trip status after start
    trip_after_start = api_call("GET", f"/trips/{TEST_DATA['trip_id']}", TOKEN)
    trip_status_start = extract_value(trip_after_start or {}, "data.status")
    print(f"\nTrip Status after start: {trip_status_start}")

    # Test 5: Complete Trip
    complete_trip_resp = api_call("POST", f"/trips/{TEST_DATA['trip_id']}/complete", TOKEN,
                                 expected_status=200, test_name="Complete Trip")

    # Verify trip status after complete
    trip_after_complete = api_call("GET", f"/trips/{TEST_DATA['trip_id']}", TOKEN)
    trip_status_complete = extract_value(trip_after_complete or {}, "data.status")
    print(f"\nTrip Status after complete: {trip_status_complete}")

    # ============================================
    # PHASE 12.1: TripWaypoint Updates
    # ============================================
    print("\n" + "=" * 50)
    print("PHASE 12.1: TRIP WAYPOINT UPDATES")
    print("=" * 50)

    # Create new order for waypoint testing
    print("\nCreating new order for waypoint testing...")
    order2_data = {
        "customer_id": TEST_DATA["customer_id"],
        "order_type": "FTL",
        "reference_code": "WAYPOINT-TEST-001",
        "order_waypoints": [
            {
                "type": "Pickup",
                "address_id": TEST_DATA["pickup_addr_id"],
                "scheduled_date": "2026-01-27"
            },
            {
                "type": "Delivery",
                "address_id": TEST_DATA["delivery_addr_id"],
                "scheduled_date": "2026-01-27"
            }
        ]
    }

    order2_resp = api_call("POST", "/orders", TOKEN, order2_data,
                          expected_status=201, test_name="Create Order for Waypoint Test")
    TEST_DATA["order2_id"] = extract_value(order2_resp or {}, "data.id")

    # Create trip for order 2
    trip2_data = {
        "order_id": TEST_DATA["order2_id"],
        "driver_id": TEST_DATA["driver_id"],
        "vehicle_id": TEST_DATA["vehicle_id"],
        "notes": "Test waypoint updates"
    }

    trip2_resp = api_call("POST", "/trips", TOKEN, trip2_data,
                         expected_status=201, test_name="Create Trip for Waypoint Test")
    TEST_DATA["trip2_id"] = extract_value(trip2_resp or {}, "data.id")

    # Test 6: Verify Trip Detail includes waypoints
    trip2_detail = api_call("GET", f"/trips/{TEST_DATA['trip2_id']}", TOKEN,
                           expected_status=200)

    waypoints = extract_value(trip2_detail or {}, "data.waypoints")
    print(f"\nTrip 2 Waypoints: {json.dumps(waypoints, indent=2)}")

    if waypoints and len(waypoints) >= 2:
        wp1_id = waypoints[0].get("order_waypoint_id")
        wp2_id = waypoints[1].get("order_waypoint_id")

        print(f"\nWaypoint 1 Order Waypoint ID: {wp1_id}")
        print(f"Waypoint 2 Order Waypoint ID: {wp2_id}")

        # Test 7: Update Waypoint Sequence
        if wp1_id and wp2_id:
            update_waypoint_data = {
                "waypoints": [
                    {"order_waypoint_id": wp1_id, "sequence_number": 1},
                    {"order_waypoint_id": wp2_id, "sequence_number": 2}
                ]
            }

            api_call("PUT", f"/trips/{TEST_DATA['trip2_id']}", TOKEN,
                    update_waypoint_data, expected_status=200,
                    test_name="Update Waypoint Sequence")
    else:
        print(f"{Colors.YELLOW}Insufficient waypoints for sequence test{Colors.NC}")

    # ============================================
    # PHASE 16: Reschedule Flow
    # ============================================
    print("\n" + "=" * 50)
    print("PHASE 16: RESCHEDULE FLOW")
    print("=" * 50)

    # Test 8: Create reschedule scenario
    order3_data = {
        "customer_id": TEST_DATA["customer_id"],
        "order_type": "FTL",
        "reference_code": "RESCHEDULE-TEST-001",
        "order_waypoints": [
            {
                "type": "Pickup",
                "address_id": TEST_DATA["pickup_addr_id"],
                "scheduled_date": "2026-01-28"
            },
            {
                "type": "Delivery",
                "address_id": TEST_DATA["delivery_addr_id"],
                "scheduled_date": "2026-01-28"
            }
        ]
    }

    order3_resp = api_call("POST", "/orders", TOKEN, order3_data,
                          expected_status=201, test_name="Create Order for Reschedule")
    TEST_DATA["order3_id"] = extract_value(order3_resp or {}, "data.id")

    trip3_data = {
        "order_id": TEST_DATA["order3_id"],
        "driver_id": TEST_DATA["driver_id"],
        "vehicle_id": TEST_DATA["vehicle_id"],
        "notes": "Trip to be rescheduled"
    }

    trip3_resp = api_call("POST", "/trips", TOKEN, trip3_data,
                         expected_status=201, test_name="Create Trip for Reschedule")
    TEST_DATA["trip3_id"] = extract_value(trip3_resp or {}, "data.id")

    # Start trip 3
    api_call("POST", f"/trips/{TEST_DATA['trip3_id']}/start", TOKEN,
            expected_status=200, test_name="Start Trip for Reschedule")

    # Get trip 3 waypoints
    trip3_detail = api_call("GET", f"/trips/{TEST_DATA['trip3_id']}", TOKEN)
    trip3_waypoints = extract_value(trip3_detail or {}, "data.waypoints")

    print(f"\nTrip 3 Waypoints: {json.dumps(trip3_waypoints, indent=2)}")

    # Mark waypoints
    if trip3_waypoints and len(trip3_waypoints) >= 2:
        waypoint1_id = trip3_waypoints[0].get("id")
        waypoint2_id = trip3_waypoints[1].get("id")

        print(f"\nWaypoint 1 ID: {waypoint1_id}")
        print(f"Waypoint 2 ID: {waypoint2_id}")

        # Mark first waypoint as completed
        if waypoint1_id:
            update_wp1_data = {
                "waypoints": [
                    {"id": waypoint1_id, "status": "Completed"}
                ]
            }
            api_call("PUT", f"/trips/{TEST_DATA['trip3_id']}", TOKEN,
                    update_wp1_data, expected_status=200,
                    test_name="Mark Waypoint 1 as Completed")

        # Mark second waypoint as Failed
        failed_waypoint_id = None
        if waypoint2_id:
            failed_waypoint_id = waypoint2_id
            update_wp2_data = {
                "waypoints": [
                    {"id": waypoint2_id, "status": "Failed"}
                ]
            }
            api_call("PUT", f"/trips/{TEST_DATA['trip3_id']}", TOKEN,
                    update_wp2_data, expected_status=200,
                    test_name="Mark Waypoint 2 as Failed")

        # Test 9: Batch Reschedule
        if failed_waypoint_id:
            reschedule_data = {
                "order_id": TEST_DATA["order3_id"],
                "waypoint_ids": [failed_waypoint_id],
                "driver_id": TEST_DATA["new_driver_id"],
                "vehicle_id": TEST_DATA["new_vehicle_id"],
                "notes": "Rescheduling failed waypoint"
            }

            reschedule_resp = api_call("POST", "/exceptions/waypoints/batch-reschedule",
                                      TOKEN, reschedule_data,
                                      expected_status=200,
                                      test_name="Batch Reschedule Waypoints")

            # Test 10: Verify after reschedule
            print("\n" + "=" * 50)
            print("VERIFICATION AFTER RESCHEDULE")
            print("=" * 50)

            # Check old trip status
            old_trip_after = api_call("GET", f"/trips/{TEST_DATA['trip3_id']}", TOKEN)
            old_trip_status = extract_value(old_trip_after or {}, "data.status")

            print(f"\nOld Trip Status: {old_trip_status}")
            if old_trip_status == "Completed":
                print(f"{Colors.GREEN}✓ Old trip marked as Completed{Colors.NC}")
            else:
                print(f"{Colors.RED}✗ Old trip NOT marked as Completed{Colors.NC}")

            # Check new trip created
            new_trip_id = extract_value(reschedule_resp or {}, "data.new_trip.id")
            if new_trip_id and new_trip_id != "null":
                print(f"{Colors.GREEN}✓ New trip created: {new_trip_id}{Colors.NC}")

                new_trip_detail = api_call("GET", f"/trips/{new_trip_id}", TOKEN)
                print(f"\nNew Trip Detail: {json.dumps(new_trip_detail, indent=2)}")

                # Check waypoints reset to Pending
                new_trip_waypoints = extract_value(new_trip_detail or {}, "data.waypoints")
                if new_trip_waypoints:
                    pending_count = sum(1 for wp in new_trip_waypoints if wp.get("status") == "Pending")
                    print(f"\nWaypoints reset to Pending: {pending_count}")
                    if pending_count > 0:
                        print(f"{Colors.GREEN}✓ Waypoints reset to Pending{Colors.NC}")
                    else:
                        print(f"{Colors.RED}✗ Waypoints NOT reset to Pending{Colors.NC}")
            else:
                print(f"{Colors.RED}✗ New trip NOT created{Colors.NC}")
        else:
            print(f"{Colors.YELLOW}No failed waypoint ID available for reschedule{Colors.NC}")
    else:
        print(f"{Colors.YELLOW}Insufficient waypoints for reschedule test{Colors.NC}")

    # ============================================
    # FINAL SUMMARY
    # ============================================
    print("\n" + "=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    print(f"Total Tests: {total_tests}")
    print(f"{Colors.GREEN}Passed: {passed_tests}{Colors.NC}")
    print(f"{Colors.RED}Failed: {failed_tests}{Colors.NC}\n")

    if failed_tests == 0:
        print(f"{Colors.GREEN}ALL TESTS PASSED!{Colors.NC}")
        return 0
    else:
        print(f"{Colors.RED}SOME TESTS FAILED{Colors.NC}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
