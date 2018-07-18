#!/usr/bin/env bash

# Check if it is a pull request
if [ "${TRAVIS_PULL_REQUEST}" != "false" ]; then
    .travis/release_stable.sh
    # echo -e "Pull Request, not pushing a build"
    # exit 0;
fi

# If current dev branch is master, push to build repo master
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    .travis/release.sh
fi

# If current dev branch is stable/foo, push to build repo stable
if [[ ${TRAVIS_BRANCH} =~ stable\/* ]]; then
    .travis/release_stable.sh
fi
