FROM registry.access.redhat.com/ubi8/nginx-118

COPY ./nginx.conf /opt/app-root/etc/nginx/conf.d/default.conf
COPY ./build /opt/app-root/src/build

COPY ./chrome-config/* /opt/app-root/src/build/chrome/
COPY ./chrome-config/ansible-navigation.json /opt/app-root/src/build/chrome/ansible-navigation.json

ADD ./nginx.conf "${NGINX_CONFIGURATION_PATH}"

CMD ["nginx", "-g", "daemon off;"]
