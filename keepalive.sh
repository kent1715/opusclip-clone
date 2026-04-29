#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting dev server at $(date)" >> dev.log
  bun run dev >> dev.log 2>&1
  EXIT_CODE=$?
  echo "Server exited with code $EXIT_CODE at $(date)" >> dev.log
  sleep 2
done
