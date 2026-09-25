#!/usr/bin/env bash

set -euo pipefail

PR_TITLE=${PR_TITLE-}
PR_BODY=${PR_BODY-}

fail() {
  printf '::error::%s\n' "$1" >&2
  exit 1
}

info() {
  printf '%s\n' "$1"
}

extract_jira_keys() {
  printf '%s' "$1" |
    tr -c '[:alnum:]-' ' ' |
    awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^[A-Z][A-Z0-9]{1,9}-[0-9]+$/) print $i }' |
    sort -u
}

title_keys=()
while IFS= read -r key; do
  if [[ -n "$key" ]]; then
    title_keys+=("$key")
  fi
done < <(extract_jira_keys "$PR_TITLE")

jira_url_pattern='https?://issues\.redhat\.com/browse/[A-Za-z][A-Za-z0-9]{1,9}-[0-9]+'
title_has_jira_url=false
if [[ $PR_TITLE =~ $jira_url_pattern ]]; then
  title_has_jira_url=true
fi

has_no_ticket_declaration=false
while IFS= read -r line; do
  if grep -Eiq '^[[:space:]]*No Jira ticket[[:space:]]*:[[:space:]]*[^[:space:]].*$' <<<"$line" &&
    ! grep -Eiq '^[[:space:]]*No Jira ticket[[:space:]]*:[[:space:]]*<reason>[[:space:]]*$' <<<"$line"; then
    has_no_ticket_declaration=true
    break
  fi
done <<<"$PR_BODY"

if "$title_has_jira_url"; then
  fail 'Use the Jira issue key in the PR title, not the full Jira URL.'
fi

if ((${#title_keys[@]} > 1)); then
  fail 'PR title must contain one primary Jira issue key. Put additional related keys in the description.'
fi

if ((${#title_keys[@]} == 1)) && "$has_no_ticket_declaration"; then
  fail 'PR title contains a Jira issue key, but the description declares that no Jira ticket exists. Use one association mode.'
fi

if ((${#title_keys[@]} == 0)); then
  if "$has_no_ticket_declaration"; then
    info 'No-ticket declaration found in PR description.'
    exit 0
  fi

  fail 'PR title must contain a Jira issue key. If no Jira ticket is associated, add a standalone `No Jira ticket: <reason>` line to the PR description.'
fi

title_key=${title_keys[0]}
jira_description_url_pattern="https?://issues\\.redhat\\.com/browse/${title_key}([^[:alnum:]]|$)"
if grep -Eiq "$jira_description_url_pattern" <<<"$PR_BODY"; then
  info "Full Jira URL for issue key $title_key found in description."
  exit 0
fi

fail "PR description must include the full Jira URL for issue key $title_key. Additional related keys are allowed."
