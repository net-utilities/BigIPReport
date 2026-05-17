FROM mcr.microsoft.com/powershell:lts-7.4-alpine-3.20
RUN apk add --no-cache brotli \
    && addgroup -g 1000 -S bigipreport \
    && adduser -S -D -u 1000 -G bigipreport -h /opt/bigipreport bigipreport
WORKDIR /opt/bigipreport
RUN mkdir -p /opt/bigipreport/json \
    && touch /opt/bigipreport/json/.keep \
    && chown -R bigipreport:bigipreport /opt/bigipreport/json \
    && chmod 775 /opt/bigipreport/json
COPY --chown=bigipreport:bigipreport bigipreport.ps1 ./data-collector/bigipreport.ps1
COPY --chown=bigipreport:bigipreport modules/ ./data-collector/modules/
COPY --chmod=755 --chown=bigipreport:bigipreport collect-loop.sh ./data-collector/collect-loop.sh
USER bigipreport
ENTRYPOINT ["pwsh", "-File", "/opt/bigipreport/data-collector/bigipreport.ps1"]
