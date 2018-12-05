#!/bin/bash
set -e
set -x

# for now in chrome... push everywhere when master updates
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    for env in ci qa prod
    do
        for release in stable beta
        do
            echo
            echo
            echo "PUSHING ${env}-${release}"
            rm -rf ./build/.git
            .travis/release.sh "${env}-${release}"
        done
    done
fi
