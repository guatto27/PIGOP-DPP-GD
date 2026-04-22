#!/usr/bin/env bash
#
# Redeploy del backend PIGOP en el VPS de Hostinger (srv1532208.hstgr.cloud).
#
# Uso en el VPS (vía SSH):
#   ssh usuario@srv1532208.hstgr.cloud
#   cd /ruta/a/PIGOP-DPP         # ajustar si es distinta
#   bash deploy/hostinger_backend_redeploy.sh
#
# Prerequisitos en el VPS:
#   - El repo está clonado (rama main).
#   - Existe un virtualenv en pigop-backend/.venv con las dependencias.
#   - El servicio corre bajo systemd como "pigop-backend" (o equivalente).
#     Ajustar RESTART_CMD más abajo si usas otro manager (supervisor/pm2/forever).
#
set -euo pipefail

REPO_DIR="${REPO_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
BACKEND_DIR="$REPO_DIR/pigop-backend"
VENV_DIR="${VENV_DIR:-$BACKEND_DIR/.venv}"
SERVICE_NAME="${SERVICE_NAME:-pigop-backend}"

# Comando para reiniciar el servicio. Sobrescribe con RESTART_CMD="..." si no usas systemd.
RESTART_CMD="${RESTART_CMD:-sudo systemctl restart $SERVICE_NAME}"
STATUS_CMD="${STATUS_CMD:-sudo systemctl status $SERVICE_NAME --no-pager -l}"

echo "▶ Repo:    $REPO_DIR"
echo "▶ Backend: $BACKEND_DIR"
echo "▶ Venv:    $VENV_DIR"
echo "▶ Restart: $RESTART_CMD"
echo

cd "$REPO_DIR"
echo "▶ git pull --ff-only origin main"
git fetch origin
git pull --ff-only origin main

echo
echo "▶ Instalando / actualizando dependencias Python"
if [[ ! -d "$VENV_DIR" ]]; then
  python3 -m venv "$VENV_DIR"
fi
"$VENV_DIR/bin/pip" install --upgrade pip
"$VENV_DIR/bin/pip" install --no-cache-dir -r "$BACKEND_DIR/requirements.txt"

echo
echo "▶ Reiniciando servicio"
$RESTART_CMD

echo
echo "▶ Estado del servicio"
$STATUS_CMD || true

echo
echo "▶ Verificando endpoints nuevos (tabla permisos_overrides se autogenera en el arranque)"
# Reemplazar por la URL pública de tu backend
BACKEND_URL="${BACKEND_URL:-https://srv1532208.hstgr.cloud/api/v1}"
echo "   GET $BACKEND_URL/permisos/version"
curl -s -o /dev/null -w "     HTTP %{http_code}\n" "$BACKEND_URL/permisos/version" -H "Accept: application/json" || true

echo
echo "✅ Redeploy completado."
