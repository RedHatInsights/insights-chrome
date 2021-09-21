#!/bin/bash

if [[ ${SSO_URL} ]]; then
    sed -i "s@<script id=\"sso-script\">.*<\/script>@<script id=\"sso-script\"> window.SSO_URL = \"${SSO_URL}\"<\/script>@g" /usr/share/nginx/html/src/index.html
fi

exec "$@"
