#!/bin/bash
set -e

npm run-script build
cd build
rsync -arv -e "ssh -2" * sshacs@unprotected.upload.akamai.com:/114034/insights/static/chrome/
rsync -arv -e "ssh -2" * sshacs@unprotected.upload.akamai.com:/114034/insightsbeta/static/chrome/
