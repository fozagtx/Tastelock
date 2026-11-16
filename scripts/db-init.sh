#!/usr/bin/env bash
# Prepares the local HydraDB store directory and development auth token.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HDR="$ROOT/.hydradb"
TOKEN_FILE="$HDR/auth-token"

mkdir -p "$HDR/store" "$HDR/cache"

if [ ! -s "$TOKEN_FILE" ]; then
  printf '%s\n' 'local-development-token-32-bytes' > "$TOKEN_FILE"
  echo "created $TOKEN_FILE"
else
  echo "auth token already present"
fi

echo "hydradb store ready at $HDR"
