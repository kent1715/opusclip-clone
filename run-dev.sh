#!/bin/bash
# Auto-restart wrapper for Next.js dev server
# Restarts the server whenever it crashes

LOG_FILE="/home/z/my-project/dev.log"
SERVER_SCRIPT="/home/z/my-project/server.js"
MAX_RETRIES=0  # unlimited
RETRY_COUNT=0
RESTART_DELAY=3

echo "[$(date)] Starting auto-restart wrapper..." > "$LOG_FILE"

while true; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "[$(date)] Starting server (attempt $RETRY_COUNT)..." >> "$LOG_FILE"
  
  NODE_OPTIONS="--max-old-space-size=4096" node "$SERVER_SCRIPT" >> "$LOG_FILE" 2>&1
  EXIT_CODE=$?
  
  echo "[$(date)] Server exited with code $EXIT_CODE" >> "$LOG_FILE"
  
  # If exit code is 0 (graceful shutdown), don't restart
  if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Graceful shutdown, not restarting" >> "$LOG_FILE"
    break
  fi
  
  # Wait before restarting
  echo "[$(date)] Restarting in ${RESTART_DELAY}s..." >> "$LOG_FILE"
  sleep $RESTART_DELAY
  
  # Clean up any leftover processes
  pkill -f "next-server" 2>/dev/null || true
  sleep 1
done
