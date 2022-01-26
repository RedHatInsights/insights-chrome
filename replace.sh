#!/bin/bash

if [[ ${SSO_URL} ]]; then
    cp /opt/app-root/src/index.html /tmp/tmp_index.html
    sed -i "s@<script id=\"sso-script\">.*<\/script>@<script id=\"sso-script\"> window.SSO_URL = \"${SSO_URL}\"<\/script>@g" /tmp/tmp_index.html;
    mv /tmp/tmp_index.html /opt/app-root/src/index.html
fi

exec "$@"
