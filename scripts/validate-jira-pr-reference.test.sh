#!/usr/bin/env bash

set -euo pipefail

validator="$(dirname "$0")/validate-jira-pr-reference.sh"
title='HTTPS://issues.redhat.com/browse/RHCLOUD-123: Fix docs'
body='https://issues.redhat.com/browse/RHCLOUD-123'

if output=$(PR_TITLE="$title" PR_BODY="$body" bash "$validator" 2>&1); then
  printf 'Expected uppercase-scheme Jira URL in title to be rejected.\n' >&2
  exit 1
fi

if [[ "$output" != *'Use the Jira issue key in the PR title, not the full Jira URL.'* ]]; then
  printf 'Unexpected validator output:\n%s\n' "$output" >&2
  exit 1
fi

printf 'Uppercase-scheme Jira URL title rejection passed.\n'
