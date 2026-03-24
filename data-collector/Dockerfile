FROM mcr.microsoft.com/powershell:lts-7.4-alpine-3.20
RUN apk add --no-cache brotli
WORKDIR /opt/bigipreport
COPY bigipreport.ps1 ./
COPY modules/ ./modules/
USER 1000
ENTRYPOINT ["pwsh", "-File", "/opt/bigipreport/bigipreport.ps1"]
