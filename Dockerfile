FROM nginx

ENV SSO_URL ${SSO_URL}
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./replace.sh /etc/nginx/replace.sh
CMD sh -c "/etc/nginx/replace.sh $SSO_URL && nginx -g 'daemon off;'"
COPY . /usr/share/nginx/html
