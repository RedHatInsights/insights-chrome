#!/bin/bash

# Caddy Configuration Test Script
# This script creates test files, starts Caddy, and tests various routes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

TEST_DIR="/tmp/caddy-test"
CADDY_PORT=8000
METRICS_PORT=9000
CADDY_PID=""

CADDYFILE_SOURCE="${CADDYFILE_SOURCE:-./Caddyfile}"

# Cleanup function
cleanup() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    caddy stop 2>/dev/null || true
    rm -rf "$TEST_DIR"
    echo -e "${GREEN}Cleanup complete${NC}"
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

# Create test directory structure and files
setup_test_files() {
    echo -e "${YELLOW}Setting up test files...${NC}"
    
    # Create the exact directory structure expected by the real Caddyfile
    mkdir -p "$TEST_DIR/srv/dist/"
    
    # Create test files matching what the real Caddyfile expects
    cat > "$TEST_DIR/srv/dist/index.html" << EOF
<!DOCTYPE html>
<html>
<head><title>Chrome App</title></head>
<body><h1>Chrome Application</h1></body>
</html>
EOF
    
    # Create additional test files
    echo "app.js" > "$TEST_DIR/srv/dist/app.js"
    
    # Create a test SVG image file
    cat > "$TEST_DIR/srv/dist/image.svg" << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
  <text x="50" y="55" text-anchor="middle" font-family="Arial" font-size="14" fill="white">Test</text>
</svg>
EOF
}

# Start Caddy server
start_caddy() {
    echo -e "${YELLOW}Starting Caddy server...${NC}"
    
    CADDYFILE_ABS_PATH=$(realpath "$CADDYFILE_SOURCE" 2>/dev/null)
    cd "$TEST_DIR"
    cp "$CADDYFILE_ABS_PATH" .
    
    # Replace absolute paths in Caddyfile with our test directory paths
    sed -i "s|/srv/dist|$TEST_DIR/srv/dist|g" Caddyfile
    
    # Set environment variables to disable TLS for testing
    export CADDY_TLS_MODE=""
    export CADDY_TLS_CERT=""
    
    caddy start --config Caddyfile --adapter caddyfile
    
    # Wait for Caddy to start
    sleep 3
    
    # Check if Caddy is running by checking if port is open
    if ! curl -s --max-time 2 http://localhost:8000 >/dev/null 2>&1; then
        echo -e "${RED}Failed to start Caddy - port 8000 not responding${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}Caddy started successfully${NC}"
}

# Test function
test_route() {
    local route="$1"
    local expected_status="$2"
    local expected_content="$3"
    local description="$4"
    
    echo -e "\n${YELLOW}Testing: $description${NC}"
    echo "Route: $route"
    
    local response=$(curl -s -w "\n%{http_code}" "http://localhost:$CADDY_PORT$route")
    local body=$(echo "$response" | head -n -1)
    local status=$(echo "$response" | tail -n 1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ Status: $status (expected: $expected_status)${NC}"
    else
        echo -e "${RED}✗ Status: $status (expected: $expected_status)${NC}"
        return 1
    fi
    
    if [ ! -z "$expected_content" ]; then
        if echo "$body" | grep -q "$expected_content"; then
            echo -e "${GREEN}✓ Content contains: '$expected_content'${NC}"
        else
            echo -e "${RED}✗ Content does not contain: '$expected_content'${NC}"
            echo "Actual content: $body"
            return 1
        fi
    fi
    
    return 0
}

# Run all tests
run_tests() {
    echo -e "\n${YELLOW}Running tests...${NC}"
    
    local failed=0
    
    # Test specific chrome app routes
    test_route "/apps/chrome/index.html" "200" "Chrome Application" "Chrome app index.html" || ((failed++))
    
    # Test static asset serving - SVG image
    test_route "/apps/chrome/image.svg" "200" "<svg xmlns=" "Chrome app SVG image" || ((failed++))

    # Test non-existent app (should return 404)
    test_route "/apps/doesnt-exist/file.js" "404" "Not found" "Non-existent app file (404 test)" || ((failed++))
    
    # Test fallback behavior - /subscriptions should point to index.html
    test_route "/subscriptions" "200" "Chrome Application" "Subscriptions fallback to index.html" || ((failed++))
    
    # Test non-existent file in chrome app (should return 404)
    test_route "/apps/chrome/doesnt-exist.js" "404" "" "Non-existent file in chrome app (404 test)" || ((failed++))
    
    # Test metrics endpoint (on port 9000)
    echo -e "\n${YELLOW}Testing: Metrics endpoint${NC}"
    echo "Route: http://localhost:9000/metrics"
    local metrics_response=$(curl -s -w "\n%{http_code}" "http://localhost:9000/metrics")
    local metrics_status=$(echo "$metrics_response" | tail -n 1)
    if [ "$metrics_status" = "200" ]; then
        echo -e "${GREEN}✓ Metrics Status: $metrics_status (expected: 200)${NC}"
    else
        echo -e "${RED}✗ Metrics Status: $metrics_status (expected: 200)${NC}"
        ((failed++))
    fi
    
    echo -e "\n${YELLOW}Test Summary:${NC}"
    if [ $failed -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✓${NC}"
        return 0
    else
        echo -e "${RED}$failed test(s) failed ✗${NC}"
        return 1
    fi
}

# Check if Caddy is installed
check_caddy() {
    if ! command -v caddy &> /dev/null; then
        echo -e "${RED}Caddy is not installed. Please install Caddy first.${NC}"
        echo "Visit: https://caddyserver.com/docs/install"
        exit 1
    fi
    echo -e "${GREEN}Caddy found: $(caddy version)${NC}"
}

# Main execution
main() {
    echo -e "${GREEN}=== Caddy Configuration Test ===${NC}"

    check_caddy
    setup_test_files
    start_caddy
    
    # Give Caddy a moment to fully initialize
    sleep 1
    
    run_tests
    local test_result=$?
    
    echo -e "\n${GREEN}=== Test Complete ===${NC}"
    return $test_result
}

# Run the main function
main "$@"
