#!/bin/bash

set -e


TEST_CONT="${PROJECT_NAME}-install"
IMG_TAG=$(git rev-parse --short=8 HEAD)
CONTAINER_NAME="${TEST_CONT}-${IMG_TAG}" 
CONTAINER_WORKDIR="/opt/app-root/src"

# --ignore : ignore volume creation if already exists - DEBUG purposes only.
docker volume create node_modules
docker run --name "$CONTAINER_NAME" -d --rm -t --entrypoint bash \
    -v "node_modules:${CONTAINER_WORKDIR}/node_modules" "${NODE_BASE_IMAGE}"

docker cp ./. "${CONTAINER_NAME}:${CONTAINER_WORKDIR}"

docker exec -it "$CONTAINER_NAME" "npm install"
docker stop "$CONTAINER_NAME"
