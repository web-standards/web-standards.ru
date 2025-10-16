#!/usr/bin/env bash
set -euo pipefail

export DOCKER_BUILDKIT=1


if [ -z "$SSH_AUTH_SOCK" ]; then
    echo "❌ SSH agent not available. Run 'ssh-agent' and 'ssh-add' first."
    exit 1
fi


task="${1:-}"
certs_dir="${2:-./certs}"

case "$task" in
    build)
        docker buildx build --ssh default -t webstandards_ru --build-arg 'NGINX_CONF=nginx.conf' --build-arg 'NGINX_LOCAL_CONF=nginx.local.conf' .
        ;;
    run-local)
        docker run --rm -p 8080:80 webstandards_ru nginx -g 'daemon off;' -c /etc/nginx/nginx.local.conf
        ;;
    run-prod)
        [ -n "$certs_dir" ] || { printf "Нет сертификатов. Проверьте папку $certs_dir\n" >&2; exit 1; }
        docker run --rm \
        -v "$certs_dir":/etc/letsencrypt/live/web-standards.ru:ro \
        -p 80:80 \
        -p 443:443 \
        webstandards_ru
        ;;
    debug)
        docker run --rm -it -p 8080:80 webstandards_ru sh
        ;;
    *)
        printf "Неправильная команда, должно быть что-то из этого: %s {build|run-local|run-prod}\n" "$(basename "$0")" >&2
        exit 1
        ;;
esac
