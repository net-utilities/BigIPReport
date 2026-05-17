#!/bin/sh
set -eu

INTERVAL="${COLLECT_INTERVAL_MINUTES:-30}"
SCRIPT="/opt/bigipreport/data-collector/bigipreport.ps1"

while true; do
	echo "$(date '+%Y-%m-%d %H:%M:%S') Starting collection..."
	if pwsh -File "$SCRIPT"; then
		echo "$(date '+%Y-%m-%d %H:%M:%S') Collection finished successfully."
	else
		echo "$(date '+%Y-%m-%d %H:%M:%S') Collection failed (exit $?)." >&2
	fi
	echo "$(date '+%Y-%m-%d %H:%M:%S') Next run in ${INTERVAL} minute(s)."
	sleep $((INTERVAL * 60))
done
