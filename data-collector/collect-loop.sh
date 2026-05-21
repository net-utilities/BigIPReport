#!/bin/sh
set -eu

PERIOD_MINUTES="${COLLECT_INTERVAL_MINUTES:-30}"
PERIOD_SECONDS=$((PERIOD_MINUTES * 60))
SCRIPT="/opt/bigipreport/data-collector/bigipreport.ps1"

while true; do
	run_start=$(date +%s)
	echo "$(date '+%Y-%m-%d %H:%M:%S') Starting collection..."
	if pwsh -File "$SCRIPT"; then
		echo "$(date '+%Y-%m-%d %H:%M:%S') Collection finished successfully."
	else
		echo "$(date '+%Y-%m-%d %H:%M:%S') Collection failed (exit $?)." >&2
	fi
	elapsed=$(( $(date +%s) - run_start ))
	wait_seconds=$(( PERIOD_SECONDS - elapsed ))
	if [ "$wait_seconds" -lt 0 ]; then
		echo "$(date '+%Y-%m-%d %H:%M:%S') Collection took ${elapsed}s (longer than ${PERIOD_MINUTES} minute period); starting next run immediately." >&2
		wait_seconds=0
	else
		echo "$(date '+%Y-%m-%d %H:%M:%S') Waiting ${wait_seconds}s before next run (${PERIOD_MINUTES} minute period, ${elapsed}s spent collecting)."
	fi
	sleep "$wait_seconds"
done
