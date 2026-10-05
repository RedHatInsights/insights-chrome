#!/usr/bin/env bash

set -euo pipefail

validator="$(dirname "$0")/validate-jira-pr-reference.sh"
pass=0
fail=0

run_test() {
  local description="$1"
  local expected_exit="$2"  # 0 = should pass, 1 = should fail
  local pr_title="$3"
  local pr_body="$4"
  local expected_msg="${5-}"

  if output=$(PR_TITLE="$pr_title" PR_BODY="$pr_body" bash "$validator" 2>&1); then
    actual_exit=0
  else
    actual_exit=1
  fi

  if [[ "$actual_exit" -ne "$expected_exit" ]]; then
    printf 'FAIL: %s\n  Expected exit %d, got %d\n  Output: %s\n' "$description" "$expected_exit" "$actual_exit" "$output" >&2
    ((fail++)) || true
    return
  fi

  if [[ -n "$expected_msg" ]] && [[ "$output" != *"$expected_msg"* ]]; then
    printf 'FAIL: %s\n  Expected message containing: %s\n  Got: %s\n' "$description" "$expected_msg" "$output" >&2
    ((fail++)) || true
    return
  fi

  printf 'PASS: %s\n' "$description"
  ((pass++)) || true
}

# --- Title URL rejection (both hostnames) ---

run_test "Reject issues.redhat.com URL in title" 1 \
  'https://issues.redhat.com/browse/RHCLOUD-123: Fix docs' \
  'https://issues.redhat.com/browse/RHCLOUD-123' \
  'Use the Jira issue key in the PR title, not the full Jira URL.'

run_test "Reject uppercase-scheme issues.redhat.com URL in title" 1 \
  'HTTPS://issues.redhat.com/browse/RHCLOUD-123: Fix docs' \
  'https://issues.redhat.com/browse/RHCLOUD-123' \
  'Use the Jira issue key in the PR title, not the full Jira URL.'

run_test "Reject redhat.atlassian.net URL in title" 1 \
  'https://redhat.atlassian.net/browse/RHCLOUD-123: Fix docs' \
  'https://redhat.atlassian.net/browse/RHCLOUD-123' \
  'Use the Jira issue key in the PR title, not the full Jira URL.'

run_test "Reject uppercase-scheme redhat.atlassian.net URL in title" 1 \
  'HTTPS://redhat.atlassian.net/browse/RHCLOUD-123: Fix docs' \
  'https://redhat.atlassian.net/browse/RHCLOUD-123' \
  'Use the Jira issue key in the PR title, not the full Jira URL.'

# --- Body URL acceptance (both hostnames) ---

run_test "Accept issues.redhat.com URL in body" 0 \
  'RHCLOUD-123: Fix docs' \
  'https://issues.redhat.com/browse/RHCLOUD-123'

run_test "Accept redhat.atlassian.net URL in body" 0 \
  'RHCLOUD-123: Fix docs' \
  'https://redhat.atlassian.net/browse/RHCLOUD-123'

run_test "Accept issues.redhat.com URL in multiline body" 0 \
  'RHCLOUD-456: Update config' \
  'Some context here
https://issues.redhat.com/browse/RHCLOUD-456
More details'

run_test "Accept redhat.atlassian.net URL in multiline body" 0 \
  'RHCLOUD-456: Update config' \
  'Some context here
https://redhat.atlassian.net/browse/RHCLOUD-456
More details'

# --- Missing body URL ---

run_test "Reject missing URL in body" 1 \
  'RHCLOUD-789: Some fix' \
  'This PR fixes a bug' \
  'PR description must include the full Jira URL for issue key RHCLOUD-789'

# --- No-ticket declaration ---

run_test "Accept no-ticket declaration" 0 \
  'Fix typo in README' \
  'No Jira ticket: trivial typo fix'

run_test "Reject placeholder no-ticket declaration" 1 \
  'Fix something' \
  'No Jira ticket: <reason>' \
  'PR title must contain a Jira issue key'

# --- Multiple keys in title ---

run_test "Reject multiple keys in title" 1 \
  'RHCLOUD-111 RHCLOUD-222: Big change' \
  'https://issues.redhat.com/browse/RHCLOUD-111' \
  'PR title must contain one primary Jira issue key'

# --- Conflicting key + no-ticket ---

run_test "Reject key in title with no-ticket declaration" 1 \
  'RHCLOUD-333: Something' \
  'No Jira ticket: testing' \
  'Use one association mode'

# --- No key, no declaration ---

run_test "Reject title without key and without declaration" 1 \
  'Fix a random bug' \
  'Just some PR body text' \
  'PR title must contain a Jira issue key'

# --- Summary ---

printf '\n--- Results: %d passed, %d failed ---\n' "$pass" "$fail"
if ((fail > 0)); then
  exit 1
fi
