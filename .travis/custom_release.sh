# for now in chrome... push everywhere when master updates
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    .travis/release.sh "ci-beta"
    .travis/release.sh "ci-stable"

    .travis/release.sh "qa-beta"
    .travis/release.sh "qa-stable"


    .travis/release.sh "prod-beta"
    .travis/release.sh "prod-stable"
fi
