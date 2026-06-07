#!/bin/bash
set -e
npm run build
tar czf /tmp/mem-dist.tar.gz -C dist .

# Try SSH first
if ssh -p 1020 -i ~/.ssh/id_ed25519_sered -o BatchMode=yes -o ConnectTimeout=5 r307889@sinilos.com 'echo OK' 2>/dev/null; then
  scp -P 1020 -i ~/.ssh/id_ed25519_sered -o BatchMode=yes /tmp/mem-dist.tar.gz r307889@sinilos.com:/tmp/
  ssh -p 1020 -i ~/.ssh/id_ed25519_sered -o BatchMode=yes r307889@sinilos.com \
    'rm -rf ~/memoria.sinilos.com/* && tar xzf /tmp/mem-dist.tar.gz -C ~/memoria.sinilos.com/ && rm /tmp/mem-dist.tar.gz && echo OK'
else
  # Fallback: cPanel API
  echo "SSH bloquejat, usant cPanel API..."
  source "$(dirname "$0")/.env.cpanel" 2>/dev/null || true
  CPANEL_TOKEN="${CPANEL_TOKEN:-YSBH5DCSC3BJI7LY21ER8A3FS3R2DZQR}"
  CPANEL_USER="${CPANEL_USER:-r307889}"
  # Upload tar
  curl -sf "https://sinilos.com:2083/execute/Fileman/upload_files" \
    -H "Authorization: cpanel ${CPANEL_USER}:${CPANEL_TOKEN}" \
    -F "dir=/home/${CPANEL_USER}/memoria.sinilos.com" \
    -F "overwrite=1" \
    -F "file-1=@/tmp/mem-dist.tar.gz" > /dev/null
  # Upload extractor
  cat > /tmp/_deploy_extract.php << 'PHP'
<?php $p=new PharData(__DIR__.'/mem-dist.tar.gz'); $p->extractTo(__DIR__,null,true); unlink(__DIR__.'/mem-dist.tar.gz'); unlink(__FILE__); echo 'OK';
PHP
  curl -sf "https://sinilos.com:2083/execute/Fileman/upload_files" \
    -H "Authorization: cpanel ${CPANEL_USER}:${CPANEL_TOKEN}" \
    -F "dir=/home/${CPANEL_USER}/memoria.sinilos.com" \
    -F "overwrite=1" \
    -F "file-1=@/tmp/_deploy_extract.php" > /dev/null
  # Execute extractor
  sleep 1
  curl -sf "https://memoria.sinilos.com/_deploy_extract.php" > /dev/null || true
  rm -f /tmp/_deploy_extract.php
fi

rm -f /tmp/mem-dist.tar.gz
echo "✓ Desplegado en memoria.sinilos.com"
