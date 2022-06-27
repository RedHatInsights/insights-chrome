#!/bin/bash
set -e
set -x

# push to ci and qa when master merges
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    for env in ci qa
    do
        echo
        echo
        echo "PUSHING ${env}-beta"
        rm -rf ./build/.git
        .travis/release.sh "${env}-beta"
    done

    echo
    echo
    echo "PUSHING dev-build"
    rm -rf ./build/.git
    .travis/release.sh "dev-beta"
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

    echo
    echo
    echo "PUSHING dev-build"
    rm -rf ./build/.git
    .travis/release.sh "dev-stable"
fi

if [[ "${TRAVIS_BRANCH}" = "prod-beta" || "${TRAVIS_BRANCH}" = "prod-stable" ]]; then
    echo
    echo
    echo "PUSHING ${TRAVIS_BRANCH}"
    rm -rf ./build/.git
    .travis/release.sh "${TRAVIS_BRANCH}"
fi
