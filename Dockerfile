FROM quay.io/redhat-services-prod/hcm-eng-prod-tenant/caddy-ubi:3ce2c4c

ENV CADDY_TLS_MODE http_port 8000

COPY --from=quay.io/redhat-services-prod/hcc-platex-services-tenant/valpop:latest /usr/local/bin/valpop /usr/local/bin/valpop

COPY ./Caddyfile /etc/caddy/Caddyfile
COPY ./build /srv/dist
COPY ./package.json /srv/package.json

WORKDIR /srv
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile"]
