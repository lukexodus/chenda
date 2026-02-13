#!/bin/bash

# Test script for Order API endpoints
# Tests the complete order workflow

echo "🛒 Testing Order API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set base URL
BASE_URL="http://localhost:3001/api"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "  ${GREEN}✓${NC} $2"
    else
        echo -e "  ${RED}✗${NC} $2"
    fi
}

# Helper function to extract JSON value
extract_json() {
    echo $1 | grep -o "\"$2\"[^,}]*" | cut -d':' -f2 | tr -d ' ",'
}

echo "1. Testing Payment Methods Endpoint (Public)"
response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "${BASE_URL}/orders/payment-methods")
http_code=$(echo $response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
content=$(echo $response | sed -e 's/HTTPSTATUS\:.*//g')

if [ $http_code -eq 200 ]; then
    print_result 0 "Get payment methods"
    echo "     - Available payment methods fetched successfully"
else
    print_result 1 "Get payment methods - HTTP $http_code"
    exit 1
fi

echo ""
echo "2. Login as a buyer"
# Login as buyer (user ID 1 from seeds)
login_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"maria.santos@email.com","password":"password123"}')

login_http_code=$(echo $login_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ $login_http_code -eq 200 ]; then
    print_result 0 "Buyer login"
    # Extract session cookie
    session_cookie=$(echo $login_response | grep -o 'connect.sid=[^;]*' || echo "")
    if [ -z "$session_cookie" ]; then
        # Alternative extraction method
        session_cookie="chenda-session=test"
    fi
else
    print_result 1 "Buyer login - HTTP $login_http_code"
    exit 1
fi

echo ""
echo "3. Creating an order"
# Create order for product ID 2 (should exist from seeds)
order_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${BASE_URL}/orders" \
    -H "Content-Type: application/json" \
    -H "Cookie: $session_cookie" \
    -d '{
        "product_id": 2,
        "quantity": 2,
        "payment_method": "gcash"
    }')

order_http_code=$(echo $order_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
order_content=$(echo $order_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ $order_http_code -eq 201 ]; then
    print_result 0 "Create order"
    # Extract order ID from response
    order_id=$(echo $order_content | grep -o '"id"[^,}]*' | cut -d':' -f2 | tr -d ' ",')
    echo "     - Order ID: $order_id"
else
    print_result 1 "Create order - HTTP $order_http_code"
    echo "     Response: $order_content"
    
    # Continue with a mock order ID for testing other endpoints
    order_id=1
fi

echo ""
echo "4. View order details"
view_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "${BASE_URL}/orders/${order_id}" \
    -H "Cookie: $session_cookie")

view_http_code=$(echo $view_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ $view_http_code -eq 200 ] || [ $view_http_code -eq 404 ]; then
    if [ $view_http_code -eq 200 ]; then
        print_result 0 "View order details"
    else
        print_result 1 "View order details - Order not found (404)"
    fi
else
    print_result 1 "View order details - HTTP $view_http_code"
fi

echo ""
echo "5. Process payment (Mock)"
payment_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${BASE_URL}/orders/${order_id}/payment" \
    -H "Content-Type: application/json" \
    -H "Cookie: $session_cookie")

payment_http_code=$(echo $payment_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')
payment_content=$(echo $payment_response | sed -e 's/HTTPSTATUS\:.*//g')

if [ $payment_http_code -eq 200 ]; then
    print_result 0 "Process payment"
    echo "     - Mock payment processed successfully"
elif [ $payment_http_code -eq 400 ]; then
    print_result 1 "Process payment - Payment failed (as expected for mock)"
    echo "     - Mock payment failure (this is normal)"
elif [ $payment_http_code -eq 404 ]; then
    print_result 1 "Process payment - Order not found"
else
    print_result 1 "Process payment - HTTP $payment_http_code"
    echo "     Response: $payment_content"
fi

echo ""
echo "6. List user's orders"
list_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "${BASE_URL}/orders?limit=10" \
    -H "Cookie: $session_cookie")

list_http_code=$(echo $list_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ $list_http_code -eq 200 ]; then
    print_result 0 "List orders"
else
    print_result 1 "List orders - HTTP $list_http_code"
fi

echo ""
echo "7. Login as a seller to test seller endpoints"
seller_login_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"juan.delacruz@email.com","password":"password123"}')

seller_http_code=$(echo $seller_login_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ $seller_http_code -eq 200 ]; then
    print_result 0 "Seller login"
    seller_cookie=$(echo $seller_login_response | grep -o 'connect.sid=[^;]*' || echo "chenda-session=seller")
else
    print_result 1 "Seller login - HTTP $seller_http_code"
    seller_cookie="chenda-session=seller"
fi

echo ""
echo "8. Update order status (as seller)"
status_response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X PUT "${BASE_URL}/orders/${order_id}/status" \
    -H "Content-Type: application/json" \
    -H "Cookie: $seller_cookie" \
    -d '{"status": "confirmed"}')

status_http_code=$(echo $status_response | tr -d '\n' | sed -e 's/.*HTTPSTATUS://')

if [ $status_http_code -eq 200 ]; then
    print_result 0 "Update order status"
elif [ $status_http_code -eq 403 ] || [ $status_http_code -eq 404 ]; then
    print_result 1 "Update order status - Authorization/Not Found (expected if order doesn't belong to seller)"
else
    print_result 1 "Update order status - HTTP $status_http_code"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Order API Test Complete!"
echo ""
echo "📝 Mock Payment System Notes:"
echo "   - All payments are simulated"
echo "   - No real transactions are processed"
echo "   - Different payment methods have different success rates"
echo "   - GCash: 95% success rate, 2s delay"
echo "   - Cash: 99% success rate, 0.5s delay"
echo "   - Card: 90% success rate, 2.5s delay"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"