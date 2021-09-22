FROM docker.io/library/nginx

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./replace.sh /etc/nginx/replace.sh
COPY . /usr/share/nginx/html
RUN chmod a+x /etc/nginx/replace.sh

ENTRYPOINT ["/etc/nginx/replace.sh"]
CMD ["nginx", "-g", "daemon off;"]
