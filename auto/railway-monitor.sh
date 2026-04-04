#!/data/data/com.termux/files/usr/bin/bash

URL="https://rio-beta-1-production.up.railway.app"
LOG="$HOME/RIOBETA1/logs/railway.log"

mkdir -p "$HOME/RIOBETA1/logs"

while true; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")

  if [ "$STATUS" = "200" ]; then
    echo "$(date '+%H:%M:%S') ✅ Railway ONLINE ($STATUS)" >> "$LOG"
  else
    echo "$(date '+%H:%M:%S') ❌ Railway ERRO ($STATUS)" >> "$LOG"
  fi

  sleep 10
done
