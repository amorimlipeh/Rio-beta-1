#!/data/data/com.termux/files/usr/bin/bash

PASTA_DOWNLOAD=~/storage/downloads
DESTINO=~/RIOBETA1
TMP=~/RIOBETA1/tmp_extract

mkdir -p "$TMP"

echo "🤖 AUTO RIOBETA1 INICIADO..."

while true
do
  for zip in $PASTA_DOWNLOAD/*.zip
  do
    [ -e "$zip" ] || continue

    echo "📦 ZIP: $(basename "$zip")"

    rm -rf "$TMP"
    mkdir -p "$TMP"

    unzip -o "$zip" -d "$TMP" >/dev/null 2>&1

    cp -r $TMP/* "$DESTINO"/ 2>/dev/null

    cd "$DESTINO" || continue

    touch .force_commit

    git add .
    git commit -m "AUTO $(date '+%Y-%m-%d %H:%M:%S')" >/dev/null 2>&1
    git push origin main --force >/dev/null 2>&1

    echo "🚀 Deploy OK"

    rm -f "$zip"
  done

  sleep 5
done
