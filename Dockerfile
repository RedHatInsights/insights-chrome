FROM quay.io/redhat-services-prod/hcm-eng-prod-tenant/caddy-ubi:3ce2c4c

ENV CADDY_TLS_MODE http_port 8000

COPY ./Caddyfile /opt/app-root/src/Caddyfile
COPY ./build /opt/app-root/src/build
# COPY ./chrome_config/*.json /opt/app-root/src/build/chrome/
COPY ./package.json /opt/app-root/src
WORKDIR /opt/app-root/src
CMD ["caddy", "run", "--config", "/opt/app-root/src/Caddyfile"]
