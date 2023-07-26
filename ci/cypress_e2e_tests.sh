#!/bin/bash

set -x

docker login -u="$QUAY_USER" -p="$QUAY_TOKEN" quay.io

docker run \
    --name $TEST_CONT \
    -e CHROME_ACCOUNT=$CHROME_ACCOUNT \
    -e CHROME_PASSWORD=$CHROME_PASSWORD \
    --add-host stage.foo.redhat.com:127.0.0.1 \
    --add-host prod.foo.redhat.com:127.0.0.1 \
    -d -i --rm  \
    --entrypoint bash \
    "${CYPRESS_TEST_IMAGE}"

docker cp -a . "${TEST_CONT}:/e2e/"

docker exec -i $TEST_CONT sh -c "npm ci"
docker exec -i $TEST_CONT sh -c "npm run test:e2e"

RESULT=$?

if [[ $RESULT -ne 0 ]]; then
    exit $RESULT
fi

docker stop $TEST_CONT
