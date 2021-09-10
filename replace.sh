#!/bin/sh

sed -i 's/<script id="sso-script"><\/script>/<script id="sso-script"> window.SSO_URL = "'$1'"<\/script>/g' /usr/share/nginx/html/index.html
