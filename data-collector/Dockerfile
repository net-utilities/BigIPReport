FROM mcr.microsoft.com/powershell:lts-7.4-alpine-3.20
RUN apk add --no-cache brotli
WORKDIR /opt/bigipreport
RUN mkdir -p /opt/bigipreport/json
COPY bigipreport.ps1 ./data-collector/bigipreport.ps1
COPY modules/ ./data-collector/modules/
USER 1000
ENTRYPOINT ["pwsh", "-File", "/opt/bigipreport/data-collector/bigipreport.ps1"]
