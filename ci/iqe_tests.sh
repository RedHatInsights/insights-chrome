#!/bin/bash

set -x

curl -s $CICD_URL/bootstrap.sh > .cicd_bootstrap.sh 
source ./.cicd_bootstrap.sh

GIT_COMMIT="master"
IMAGE_TAG="latest"

source $CICD_ROOT/deploy_ephemeral_env.sh
source $CICD_ROOT/cji_smoke_test.sh

mkdir -p $WORKSPACE/artifacts
cat << EOF > $WORKSPACE/artifacts/junit-dummy.xml
<testsuite tests="1">
    <testcase classname="dummy" name="dummytest"/>
</testsuite>
EOF

RESULT=$?

if [[ $RESULT -ne 0 ]]; then
    exit $RESULT
fi

exit $RESULT
