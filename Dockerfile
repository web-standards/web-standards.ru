# syntax=docker/dockerfile:1.6

FROM node:lts-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY package*.json ./
RUN npm clean-install
COPY . .
RUN npm run build

FROM alpine AS nginx-config
WORKDIR /nginx
RUN apk add --no-cache git openssh-client
RUN mkdir -p -m 700 /root/.ssh
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts
RUN --mount=type=ssh git clone --depth 1 git@github.com:web-standards-ru/nginx.git .
RUN rm -rf .git

FROM alpine
ARG NGINX_LOCAL=nginx.local.conf
ARG NGINX_CONF=nginx.conf
RUN apk add --no-cache nginx nginx-mod-http-brotli nginx-mod-http-headers-more brotli-libs openssl
RUN getent group www-data || addgroup -S www-data
RUN getent passwd www-data || adduser -S -G www-data www-data
COPY --from=nginx-config /nginx /etc/nginx
COPY --from=builder /app/dist/ /var/www/web-standards.ru/html
COPY --from=builder /app/${NGINX_CONF} /etc/nginx/conf.d/default.conf
COPY --from=builder /app/${NGINX_LOCAL} /etc/nginx/${NGINX_LOCAL}
RUN sed -i '1aload_module /usr/lib/nginx/modules/ngx_http_brotli_static_module.so;' /etc/nginx/nginx.conf
RUN sed -i '1aload_module /usr/lib/nginx/modules/ngx_http_brotli_filter_module.so;' /etc/nginx/nginx.conf
RUN mkdir -p /etc/ssl/certs && openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
