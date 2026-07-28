FROM nginx:alpine

RUN apk add --no-cache gettext

COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template
COPY start.sh /start.sh
RUN chmod +x /start.sh

COPY . /usr/share/nginx/html

EXPOSE 8080

CMD ["/start.sh"]
