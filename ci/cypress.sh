#!/bin/bash

TEST_CONT="${PROJECT_NAME}-cypress"
IMG_TAG=$(git rev-parse --short=8 HEAD)
CONTAINER_NAME="${TEST_CONT}-${IMG_TAG}" 

docker login -u="$QUAY_USER" -p="$QUAY_TOKEN" quay.io

docker run --name "$CONTAINER_NAME" -d -i --rm "${CYPRESS_TEST_IMAGE}" /bin/bash

docker cp -a . "${CONTAINER_NAME}:/e2e/"

docker exec -i "$CONTAINER_NAME" sh -c "npm install"

docker exec -i "$CONTAINER_NAME" sh -c "npm run test:ct"
docker stop "$CONTAINER_NAME"
