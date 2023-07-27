#!/bin/bash

PROJECT_NAME="insights-chrome"
TEST_CONT="${PROJECT_NAME}-cypress"
IMG_TAG=$(git rev-parse --short=8 HEAD)

docker run --name "${TEST_CONT}-${IMG_TAG}" -d -i "${NODE_BASE_IMAGE}" /bin/sh

docker cp . "${TEST_CONT}-${IMG_TAG}:/opt/app-root/src/"

docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "dnf install -y bzip2 fontconfig nss.x86_64 pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 libdrm libgbm libxshmfence nss libXScrnSaver alsa-lib wget liberation-*"

docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm install"

docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm run cypress:run"
docker exec -i -w "/opt/app-root/src/" "${TEST_CONT}-${IMG_TAG}" sh -c "npm run test:ct"
