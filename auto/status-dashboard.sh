#!/data/data/com.termux/files/usr/bin/bash

LOG="$HOME/RIOBETA1/logs/onauto.log"

bg_status() {
  local ok=1
  pgrep -f "monitor-downloads.sh" >/dev/null 2>&1 || ok=0
  pgrep -f "status-monitor.sh" >/dev/null 2>&1 || ok=0
  [ "$ok" -eq 1 ] && echo "ATIVO" || echo "PARADO"
}

start_bg() {
  pkill -f "monitor-downloads.sh" 2>/dev/null
  pkill -f "status-monitor.sh" 2>/dev/null
  sleep 1

  [ -x "$HOME/RIOBETA1/auto/monitor-downloads.sh" ] && \
    nohup bash "$HOME/RIOBETA1/auto/monitor-downloads.sh" >> "$LOG" 2>&1 &

  [ -x "$HOME/RIOBETA1/auto/status-monitor.sh" ] && \
    nohup bash "$HOME/RIOBETA1/auto/status-monitor.sh" >> "$LOG" 2>&1 &
}

stop_bg() {
  pkill -f "monitor-downloads.sh" 2>/dev/null
  pkill -f "status-monitor.sh" 2>/dev/null
}

toggle_bg() {
  if [ "$(bg_status)" = "ATIVO" ]; then
    stop_bg
    echo "$(date '+%Y-%m-%d %H:%M:%S') 🛑 Segundo plano desligado pelo painel" >> "$LOG"
  else
    start_bg
    echo "$(date '+%Y-%m-%d %H:%M:%S') 🚀 Segundo plano ligado pelo painel" >> "$LOG"
  fi
}

draw() {
  clear

  local verde="\033[1;32m"
  local vermelho="\033[1;31m"
  local amarelo="\033[1;33m"
  local ciano="\033[1;36m"
  local reset="\033[0m"

  local BG
  BG="$(bg_status)"

  echo -e "${ciano}╔══════════════════════════════════════════════════════════════╗${reset}"
  echo -e "${ciano}║                 🚀 RIOBETA1 ONAUTO DASHBOARD               ║${reset}"
  echo -e "${ciano}╚══════════════════════════════════════════════════════════════╝${reset}"
  echo
  echo -e "🕒 $(date '+%d/%m/%Y %H:%M:%S')"
  echo -e "📁 Projeto: $HOME/RIOBETA1"
  echo

  if [ "$BG" = "ATIVO" ]; then
    echo -e "⚙️ Segundo plano: ${verde}ATIVO${reset}"
  else
    echo -e "⚙️ Segundo plano: ${vermelho}PARADO${reset}"
  fi

  if pgrep -f "monitor-downloads.sh" >/dev/null 2>&1; then
    echo -e "📦 monitor-downloads: ${verde}ATIVO${reset}"
  else
    echo -e "📦 monitor-downloads: ${vermelho}PARADO${reset}"
  fi

  if pgrep -f "status-monitor.sh" >/dev/null 2>&1; then
    echo -e "📊 status-monitor: ${verde}ATIVO${reset}"
  else
    echo -e "📊 status-monitor: ${vermelho}PARADO${reset}"
  fi

  echo
  echo "📂 ZIPS em downloads:"
  ls -1 "$HOME/storage/downloads"/*.zip 2>/dev/null | sed 's|.*/||' || echo "Nenhum ZIP pendente"

  echo
  echo "🌐 Git:"
  cd "$HOME/RIOBETA1" 2>/dev/null
  echo "Branch: $(git branch --show-current 2>/dev/null || echo '-')"
  echo "Commit: $(git log -1 --pretty=%s 2>/dev/null || echo '-')"
  echo "Hash: $(git rev-parse --short HEAD 2>/dev/null || echo '-')"

  echo
  echo "📜 Últimos logs:"
  tail -n 10 "$LOG" 2>/dev/null || echo "Sem logs ainda"

  echo
  echo -e "${amarelo}Atalhos:${reset}"
  echo "Ctrl+J  -> sair do painel (mantém segundo plano)"
  echo "Ctrl+K  -> ligar/desligar segundo plano"
}

mkdir -p "$HOME/RIOBETA1/logs"
touch "$LOG"
echo "$(date '+%Y-%m-%d %H:%M:%S') 📊 Dashboard aberto" >> "$LOG"

stty -echo -icanon time 0 min 0
trap 'stty sane; clear; exit' INT TERM EXIT

while true; do
  draw
  key="$(dd bs=1 count=1 2>/dev/null)"
  case "$key" in
    $'\x0a')
      echo "$(date '+%Y-%m-%d %H:%M:%S') ↩️ Painel fechado com Ctrl+J" >> "$LOG"
      stty sane
      clear
      exit 0
      ;;
    $'\x0b')
      toggle_bg
      ;;
  esac
  sleep 1
done
