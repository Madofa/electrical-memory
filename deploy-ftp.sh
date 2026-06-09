#!/bin/bash
# Despliegue por FTP — mecanismo oficial mientras SSH esté caído (ver deploy.sh para el histórico)
set -e
cd "$(dirname "$0")"

source ./.env.ftp

npm run build

echo "Subiendo dist/ a ftp://${FTP_HOST}/${FTP_REMOTE_DIR}/ ..."
cd dist
find . -type f | while read -r f; do
  rel="${f#./}"
  curl -s --ftp-create-dirs -T "$rel" \
    "ftp://${FTP_HOST}/${FTP_REMOTE_DIR}/${rel}" \
    --user "${FTP_USER}:${FTP_PASS}"
  echo "  ✓ $rel"
done

echo "✓ Desplegado en memoria.sinilos.com (vía FTP)"
