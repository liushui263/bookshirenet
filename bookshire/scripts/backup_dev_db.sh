#!/usr/bin/env bash
set -euo pipefail

mkdir -p backups

timestamp="$(date +%Y%m%d_%H%M%S)"
output="backups/bookshire_dev_${timestamp}.sql"

docker exec bookshire-db pg_dump -U bookshire -d bookshire > "$output"

echo "Backup written to $output"
