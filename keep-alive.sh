#!/bin/bash
cd /home/z/my-project
while true; do
  NODE_OPTIONS="--max-old-space-size=4096" node node_modules/.bin/next dev -p 3000 2>&1 | tee -a /home/z/my-project/dev.log
  echo "[$(date)] Server crashed, restarting in 2s..." >> /home/z/my-project/dev.log
  sleep 2
  # Kill any remaining processes
  pkill -9 -f "next-server" 2>/dev/null || true
  sleep 1
done
