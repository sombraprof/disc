#!/usr/bin/env bash
set -euo pipefail

# Porta padrão (pode sobrescrever via env PORT=xxxx)
PORT="${PORT:-8080}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "📦 Instalando/Atualizando dependências..."
( cd "$ROOT_DIR" && npm install )

echo "📦 Checando build de CSS (Tailwind)"
if command -v npm >/dev/null 2>&1; then
  # Verifica versão do Node (major)
  NODE_OK=0
  if command -v node >/dev/null 2>&1; then
    NODE_VER_RAW="$(node -v 2>/dev/null || echo v0.0.0)"
    NODE_MAJOR="${NODE_VER_RAW#v}"
    NODE_MAJOR="${NODE_MAJOR%%.*}"
    if [[ "$NODE_MAJOR" =~ ^[0-9]+$ ]] && [[ "$NODE_MAJOR" -ge 14 ]]; then NODE_OK=1; fi
  fi
  if [[ $NODE_OK -ne 1 ]]; then
    if [[ -f "$ROOT_DIR/css/tailwind.css" ]]; then
      echo "⚠️ Node muito antigo (>=14 recomendado). Usando CSS existente sem rebuild."
    else
      echo "❌ Node muito antigo para buildar Tailwind. Atualize para Node 18/20 ou instale via NVM."
      echo "Sugestão (Ubuntu/Debian): curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
      exit 1
    fi
  fi
  NEED_BUILD=0
  [[ ! -f "$ROOT_DIR/css/tailwind.css" ]] && NEED_BUILD=1 || true
  [[ "$ROOT_DIR/src/styles/tailwind.css" -nt "$ROOT_DIR/css/tailwind.css" ]] && NEED_BUILD=1 || true
  [[ -f "$ROOT_DIR/tailwind.config.cjs" && "$ROOT_DIR/tailwind.config.cjs" -nt "$ROOT_DIR/css/tailwind.css" ]] && NEED_BUILD=1 || true
  if [[ $NEED_BUILD -eq 1 && $NODE_OK -eq 1 ]]; then
    echo "▶️  Instalando dependências e buildando CSS"
    ( cd "$ROOT_DIR" && ( [ -f package-lock.json ] && npm ci || npm install ) && npm run build )
  else
    echo "✔️  CSS já está atualizado."
  fi
else
  echo "⚠️ npm não encontrado. Pulando build do CSS. (Instale Node.js para buildar o Tailwind)"
fi

echo "🚀 Subindo servidor HTTP estático..."

find_free_port() {
  local p=$1
  for i in {0..10}; do
    if ! lsof -i :$p >/dev/null 2>&1; then
      echo $p; return 0
    fi
    p=$((p+1))
  done
  echo "$1"
}

PORT=$(find_free_port "$PORT")
python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT_DIR/dist" --cgi &
SERVER_PID=$!

trap 'echo; echo "⏹ Encerrando servidor ($SERVER_PID)"; kill $SERVER_PID 2>/dev/null || true' INT TERM EXIT

sleep 1
URL="http://127.0.0.1:$PORT/home.html"
echo "🌐 Servindo em: $URL"

open_browser() {
  if command -v firefox >/dev/null 2>&1; then firefox --private-window "$URL";
  elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL";
  elif command -v sensible-browser >/dev/null 2>&1; then sensible-browser "$URL";
  elif command -v gnome-open >/dev/null 2>&1; then gnome-open "$URL";
  elif command -v google-chrome >/dev/null 2>&1; then google-chrome "$URL";
  else echo "Abra manualmente: $URL"; fi
}

open_browser || true

wait $SERVER_PID
