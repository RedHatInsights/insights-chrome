#!/bin/bash
gulp build
cd build
rsync -arv -e "ssh -2" * sshacs@unprotected.upload.akamai.com:/114034/insightsbeta/chrome/
