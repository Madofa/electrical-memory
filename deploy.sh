#!/bin/bash
set -e
npm run build
tar czf /tmp/mem-dist.tar.gz -C dist .
scp -P 1020 -i ~/.ssh/id_ed25519_sered -o BatchMode=yes /tmp/mem-dist.tar.gz r307889@sinilos.com:/tmp/
ssh -p 1020 -i ~/.ssh/id_ed25519_sered -o BatchMode=yes r307889@sinilos.com \
  'rm -rf ~/memoria.sinilos.com/* && tar xzf /tmp/mem-dist.tar.gz -C ~/memoria.sinilos.com/ && rm /tmp/mem-dist.tar.gz && echo OK'
rm /tmp/mem-dist.tar.gz
echo "✓ Desplegado en memoria.sinilos.com"
