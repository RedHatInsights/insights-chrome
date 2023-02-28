CONTAINER_NAME=test-build
QUAY_USER=mmarosi
QUAY_TOKEN=Bct7hsNPySYeWKWmbrFR1Psty65vMU1N2zBRdqNkDw0ov11ygL3Psu6xu3NIubCC
APP_DIR=.
IS_PR=true
CI_ROOT=
NODE_BUILD_VERSION=16
SERVER_NAME=
CYPRESS_CACHE_FOLDER="./cypress_cache"

docker run -i --name $CONTAINER_NAME \
  -v $PWD:/workspace:ro,Z \
  -e QUAY_USER=$QUAY_USER \
  -e QUAY_TOKEN=$QUAY_TOKEN \
  -e APP_DIR=$APP_DIR \
  -e IS_PR=$IS_PR \
  -e CI_ROOT=$CI_ROOT \
  -e NODE_BUILD_VERSION=$NODE_BUILD_VERSION \
  -e SERVER_NAME=$SERVER_NAME \
  -e INCLUDE_CHROME_CONFIG \
  -e CHROME_CONFIG_BRANCH \
  -e CYPRESS_CACHE_FOLDER \
  --add-host stage.foo.redhat.com:127.0.0.1 \
  --add-host prod.foo.redhat.com:127.0.0.1 \
  quay.io/cloudservices/frontend-build-container:2e1c8c0