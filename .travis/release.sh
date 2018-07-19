#!/usr/bin/env bash

MESSAGE=$(git log --format=%B -n 1 $TRAVIS_COMMIT)
cp Jenkinsfile build/Jenkinsfile
cd build
git init
git config --global user.name $COMMIT_AUTHOR_USERNAME
git config --global user.email $COMMIT_AUTHOR_EMAIL
git remote add travis-build ${REPO}.git
git add .
git commit -m 'Build by Travis'
git config --list
git push --force --set-upstream travis-build master
