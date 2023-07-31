#!/bin/bash

PROJECT_NAME="insights-chrome"
TEST_CONT="${PROJECT_NAME}-cypress"
IMG_TAG=$(git rev-parse --short=8 HEAD)

podman login -u="$QUAY_USER" -p="$QUAY_TOKEN" quay.io

podman run --name "${TEST_CONT}-${IMG_TAG}" -d -i "${CYPRESS_TEST_IMAGE}" /bin/bash

podman cp . "${TEST_CONT}-${IMG_TAG}:/e2e/"

podman exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "ls -lrd ."
podman exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "ls -l *"
podman exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "whoami"

podman exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "npm install"

podman exec -i "${TEST_CONT}-${IMG_TAG}" sh -c "npm run test:ct"
