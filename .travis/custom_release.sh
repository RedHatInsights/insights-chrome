#!/bin/bash
set -e
set -x

# for now in chrome... push everywhere when master updates
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    for env in ci #qa
    do
        echo
        echo
        echo "PUSHING ${env}-beta"
        rm -rf ./build/.git
        .travis/release.sh "${env}-beta"
    done
fi

if [ "${TRAVIS_BRANCH}" = "master-stable" ]; then
    for env in ci qa
    do
        echo
        echo
        echo "PUSHING ${env}-beta"
        rm -rf ./build/.git
        .travis/release.sh "${env}-stable"
    done
fi

if [[ "${TRAVIS_BRANCH}" = "prod-beta" || "${TRAVIS_BRANCH}" = "prod-stable" ]]; then
    echo
    echo
    echo "PUSHING ${TRAVIS_BRANCH}"
    rm -rf ./build/.git
    .travis/release.sh "${TRAVIS_BRANCH}"
fi
