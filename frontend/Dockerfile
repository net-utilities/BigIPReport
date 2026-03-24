FROM nginxinc/nginx-unprivileged:1.29-alpine
COPY frontend/default.conf /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/nginx.conf
COPY underlay/ /usr/share/nginx/html/
