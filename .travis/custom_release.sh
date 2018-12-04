# for now in chrome... push everywhere when master updates
if [ "${TRAVIS_BRANCH}" = "master" ]; then
    for env in ci qa prod
    do
        for release in stable beta
        do
            git remote remove travis-build || true
            .travis/release.sh "${env-release}"
        done
    done
fi
