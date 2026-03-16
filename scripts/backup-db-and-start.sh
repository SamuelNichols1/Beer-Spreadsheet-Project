#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DB_FILE="$PROJECT_ROOT/Beer_Spreadsheet/db.sqlite3"
CRON_SCHEDULE="0 */12 * * *"
REBOOT_CMD="/sbin/reboot"

# ======================= NETWORK DRIVE SETTINGS =======================
# Windows share from your machine:
#   \\DESKTOP-6MQI544\Network Folder
# In Linux SMB/CIFS format this becomes:
#   //DESKTOP-6MQI544/Network Folder
SHARE_PATH="//192.168.1.74/Network_Folder"

# Local Ubuntu mount location for the network share.
MOUNT_POINT="/mnt/network-drive"

# Set to true to auto-mount the SMB share if not mounted.
AUTO_MOUNT_SHARE=true

# Store SMB credentials in this file (recommended):
#   username=YOUR_WINDOWS_USERNAME
#   password=YOUR_WINDOWS_PASSWORD
#   domain=WORKGROUP   # optional
# Then lock it down: sudo chmod 600 /etc/samba/credentials/beer-backup-share
CREDENTIALS_FILE="/etc/samba/credentials/beer-backup-share"

# Backup target folder on the mounted share.
BACKUP_DEST_DIR="$MOUNT_POINT/beer-backups"
#
# One-time setup commands on Ubuntu:
#   sudo apt-get update
#   sudo apt-get install -y cifs-utils
#   sudo mkdir -p /etc/samba/credentials
#   sudo nano /etc/samba/credentials/beer-backup-share
#   sudo chmod 600 /etc/samba/credentials/beer-backup-share
#
# This script always ensures a 12-hour reboot timer exists:
#   0 */12 * * * /sbin/reboot
# =====================================================================

CRON_CMD="$REBOOT_CMD"
EXISTING_CRON="$(crontab -l 2>/dev/null || true)"
NEW_CRON="$CRON_SCHEDULE $CRON_CMD"

{
  printf "%s\n" "$EXISTING_CRON" | grep -Fv "$REBOOT_CMD" || true
  echo "$NEW_CRON"
} | crontab -

echo "Ensured 12-hour reboot cron: $NEW_CRON"

if [[ "$AUTO_MOUNT_SHARE" == "true" ]]; then
  mkdir -p "$MOUNT_POINT"

  if ! mountpoint -q "$MOUNT_POINT"; then
    if [[ ! -f "$CREDENTIALS_FILE" ]]; then
      echo "ERROR: Credentials file not found at $CREDENTIALS_FILE"
      echo "Create it with username/password for the Windows share."
      exit 1
    fi

    mount -t cifs "$SHARE_PATH" "$MOUNT_POINT" \
      -o "credentials=$CREDENTIALS_FILE,iocharset=utf8,vers=3.0,rw,uid=$(id -u),gid=$(id -g),file_mode=0664,dir_mode=0775"
  fi
fi

if [[ ! -f "$DB_FILE" ]]; then
  echo "ERROR: Database file not found at $DB_FILE"
  exit 1
fi

mkdir -p "$BACKUP_DEST_DIR"

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="$BACKUP_DEST_DIR/db.sqlite3.$TIMESTAMP"

cp "$DB_FILE" "$BACKUP_FILE"
gzip -f "$BACKUP_FILE"

echo "Backup created: $BACKUP_FILE.gz"

cd "$PROJECT_ROOT"

if docker compose version >/dev/null 2>&1; then
  docker compose up -d --build
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose up -d --build
else
  echo "ERROR: Neither 'docker compose' nor 'docker-compose' is available."
  exit 1
fi

echo "Docker Compose services started."