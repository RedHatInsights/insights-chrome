FROM quay.io/cloudservices/caddy-ubi:ec1577c

ENV CADDY_TLS_MODE http_port 8000

COPY ./Caddyfile /opt/app-root/src/Caddyfile
COPY ./dist /opt/app-root/src/dist
# COPY ./chrome_config/*.json /opt/app-root/src/dist/chrome/
COPY ./package.json /opt/app-root/src
WORKDIR /opt/app-root/src
CMD ["caddy", "run", "--config", "/opt/app-root/src/Caddyfile"]
