#!/bin/bash

function get_commit_hash() {

    local LATEST_COMMIT_HASH

    if ! LATEST_COMMIT=$(_github_api_request "pulls/$ghprbPullId" | jq -r '.head.sha'); then
        echo "Error retrieving PR information"
    fi

    return LATEST_COMMIT_HASH
}