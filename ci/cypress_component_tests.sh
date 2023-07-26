#!/bin/bash

set -x

docker login -u="$QUAY_USER" -p="$QUAY_TOKEN" quay.io

docker run --name $TEST_CONT -d -i --rm  "${CYPRESS_TEST_IMAGE}" /bin/bash

docker cp -a . "${TEST_CONT}:/e2e/"

docker exec -i $TEST_CONT sh -c "npm ci"
docker exec -i $TEST_CONT sh -c "npm run test:ct"

RESULT=$?

if [[ $RESULT -ne 0 ]]; then
    exit $RESULT
fi

docker stop $TEST_CONT

exit $RESULT
