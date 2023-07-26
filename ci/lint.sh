#!/bin/bash

set -x

docker run --name $TEST_CONT -d -i --rm $NODE_BASE_IMAGE /bin/sh

docker cp . "${TEST_CONT}:/opt/app-root/src/"

docker exec -i -w "/opt/app-root/src/" $TEST_CONT sh -c "npm ci"
docker exec -i -w "/opt/app-root/src/" $TEST_CONT sh -c "npm run lint"

docker stop $TEST_CONT
