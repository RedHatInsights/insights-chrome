#!/bin/bash

# Pre-push validation script
# Run this before pushing to catch TypeScript and test errors locally
# Usage: ./scripts/pre-push-check.sh
# Or add as git hook: ln -s ../../scripts/pre-push-check.sh .git/hooks/pre-push

set -e  # Exit on first error

echo "🔍 Running pre-push checks..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if any checks fail
FAILED=0

# Helper function to run a check
run_check() {
  local name="$1"
  local command="$2"
  local success_msg="${3:-passed}"
  local fail_msg="${4:-failed}"

  echo "⏳ $name..."

  if eval "$command" > /tmp/pre-push-$$.log 2>&1; then
    echo -e "${GREEN}✓ $name $success_msg${NC}"
    rm /tmp/pre-push-$$.log
    return 0
  else
    echo -e "${RED}✗ $name $fail_msg${NC}"
    echo "Output:"
    tail -20 /tmp/pre-push-$$.log
    rm /tmp/pre-push-$$.log
    return 1
  fi
}

# 1. TypeScript type checking via build
echo "================================================"
echo "1️⃣  TypeScript Build"
echo "================================================"
if ! npm run build 2>&1 | tee /tmp/build-$$.log | grep -q "compiled with"; then
  echo -e "${RED}✗ TypeScript build failed${NC}"
  echo ""
  echo "Errors:"
  grep -E "ERROR in|TS[0-9]{4}" /tmp/build-$$.log | head -20
  rm /tmp/build-$$.log
  FAILED=1
else
  echo -e "${GREEN}✓ TypeScript build passed${NC}"
  rm /tmp/build-$$.log
fi
echo ""

# 2. ESLint
echo "================================================"
echo "2️⃣  ESLint"
echo "================================================"
if ! npm run lint 2>&1 | tee /tmp/lint-$$.log; then
  echo -e "${RED}✗ ESLint failed${NC}"
  echo ""
  echo "Run 'npm run lint:js:fix' to auto-fix some issues"
  rm /tmp/lint-$$.log
  FAILED=1
else
  echo -e "${GREEN}✓ ESLint passed${NC}"
  rm /tmp/lint-$$.log
fi
echo ""

# 3. Unit Tests
echo "================================================"
echo "3️⃣  Unit Tests"
echo "================================================"
if ! npm test 2>&1 | tee /tmp/test-$$.log | tail -5; then
  echo -e "${RED}✗ Unit tests failed${NC}"
  echo ""
  echo "Run 'npm test' to see full output"
  rm /tmp/test-$$.log
  FAILED=1
else
  echo -e "${GREEN}✓ Unit tests passed${NC}"
  rm /tmp/test-$$.log
fi
echo ""

# Final result
echo "================================================"
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ Pre-push checks FAILED${NC}"
  echo "================================================"
  echo ""
  echo "Fix the errors above before pushing."
  echo ""
  echo "To skip these checks (not recommended):"
  echo "  git push --no-verify"
  echo ""
  exit 1
else
  echo -e "${GREEN}✅ All checks PASSED${NC}"
  echo "================================================"
  echo ""
  echo "Safe to push!"
  echo ""
  exit 0
fi
