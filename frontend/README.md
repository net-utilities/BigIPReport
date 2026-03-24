# Frontend

Nginx configuration and Dockerfile for the BigIPReport frontend container.

Built from the repository root:

```bash
docker build -f frontend/Dockerfile -t bigipreport/frontend .
```

The image is based on `nginx-unprivileged` and serves the static assets from
`underlay/` with gzip and brotli support. The `json/` output directory should
be mounted as a volume at runtime so the data collector can write to it:

```bash
docker run -d \
  -v "/opt/bigipreport/json:/usr/share/nginx/html/json" \
  -p 8080:80 \
  bigipreport/frontend
```
