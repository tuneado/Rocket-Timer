#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="$(dirname "$0")/../backups"
TARGET_DIR="$(dirname "$0")/.."

usage() {
  echo "Usage: $0 [backup-archive]" >&2
  echo "If no archive provided, restores latest *.tar.gz or *.zip in backups/" >&2
}

if [[ ${1:-} == "-h" || ${1:-} == "--help" ]]; then
  usage; exit 0
fi

archive="${1:-}"
if [[ -z "$archive" ]]; then
  # pick newest tar.gz or zip
  archive=$(ls -1t "$BACKUP_DIR"/Countdown-Timer-full-*.tar.gz 2>/dev/null | head -1 || true)
  if [[ -z "$archive" ]]; then
    archive=$(ls -1t "$BACKUP_DIR"/Countdown-Timer-*.zip 2>/dev/null | head -1 || true)
  fi
  if [[ -z "$archive" ]]; then
    echo "No backup archives found." >&2; exit 1
  fi
fi

if [[ ! -f "$archive" ]]; then
  # allow relative name
  if [[ -f "$BACKUP_DIR/$archive" ]]; then
    archive="$BACKUP_DIR/$archive"
  else
    echo "Archive not found: $archive" >&2; exit 1
  fi
fi

echo "Restoring from: $archive"
read -p "This will overwrite current working directory (excluding backups/. Continue? [y/N]) " ans
if [[ ! "$ans" =~ ^[Yy]$ ]]; then
  echo "Aborted."; exit 1
fi

# Create temp extraction directory
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

if [[ "$archive" == *.tar.gz ]]; then
  tar -xzf "$archive" -C "$TMP_DIR"
elif [[ "$archive" == *.zip ]]; then
  unzip -q "$archive" -d "$TMP_DIR"
else
  echo "Unsupported archive format." >&2; exit 1
fi

# Rsync contents back (exclude backups dir inside extracted archive)
rsync -a --delete --exclude backups "$TMP_DIR"/ "$TARGET_DIR"/

echo "Restore complete. Recommend: npm install (if dependencies changed)."
