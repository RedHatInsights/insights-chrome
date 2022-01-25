FROM registry.access.redhat.com/ubi8/nginx-118

COPY ./nginx.conf /opt/app-root/etc/nginx/conf.d/default.conf
COPY ./replace.sh /opt/app-root/src/replace.sh
COPY . /opt/app-root/src
USER 0
RUN chmod -R 777 /opt/app-root/src
USER 1001
ADD ./nginx.conf "${NGINX_CONFIGURATION_PATH}"

ENTRYPOINT ["/opt/app-root/src/replace.sh"]
CMD ["nginx", "-g", "daemon off;"]
