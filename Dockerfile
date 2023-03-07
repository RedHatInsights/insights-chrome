FROM quay.io/cloudservices/caddy-ubi:421fab5

ENV CADDY_TLS_MODE http_port 8000

COPY ./Caddyfile /opt/app-root/src/Caddyfile
COPY ./build /opt/app-root/src/build
COPY ./chrome_config/*.json /opt/app-root/src/build/chrome/
COPY ./package.json /opt/app-root/src
WORKDIR /opt/app-root/src
CMD ["caddy", "run", "--config", "/opt/app-root/src/Caddyfile"]
