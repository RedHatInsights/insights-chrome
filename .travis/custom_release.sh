#!/bin/bash
set -e
set -x

# CI
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    echo
    echo
    echo "PUSHING ci-beta"
    rm -rf ./build/.git
    .travis/release.sh "ci-beta"
fi

if [ "${TRAVIS_BRANCH}" = "ci-stable" ]; then
    echo
    echo
    echo "PUSHING ci-stable"
    rm -rf ./build/.git
    .travis/release.sh "ci-stable"
fi

# QA
if [[ "${TRAVIS_BRANCH}" = "qa-beta" || "${TRAVIS_BRANCH}" = "qa-stable" ]]; then
    echo
    echo
    echo "PUSHING ${TRAVIS_BRANCH}"
    rm -rf ./build/.git
    .travis/release.sh "${TRAVIS_BRANCH}"
fi

# PROD
if [[ "${TRAVIS_BRANCH}" = "prod-beta" || "${TRAVIS_BRANCH}" = "prod-stable" ]]; then
    echo
    echo
    echo "PUSHING ${TRAVIS_BRANCH}"
    rm -rf ./build/.git
    .travis/release.sh "${TRAVIS_BRANCH}"
fi
