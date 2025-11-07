#!/usr/bin/env bash
# Rotate the static-auth-secret for coturn and restart the service.
# Usage: sudo ./scripts/rotate_turn_secret.sh [new-secret]

set -euo pipefail

NEW_SECRET=${1:-}
if [[ -z "$NEW_SECRET" ]]; then
  NEW_SECRET=$(openssl rand -base64 24)
  echo "Generated new secret: $NEW_SECRET"
fi

CONF_DIR="/etc/turnserver.conf.d"
CONF_FILE="$CONF_DIR/00-coturn.conf"

if [[ ! -f "$CONF_FILE" ]]; then
  echo "Coturn config $CONF_FILE not found. Exiting.";
  exit 2
fi

# Replace static-auth-secret value (simple sed)
if grep -q "^static-auth-secret=" "$CONF_FILE"; then
  sed -i "s/^static-auth-secret=.*/static-auth-secret=$NEW_SECRET/" "$CONF_FILE"
else
  echo "static-auth-secret=$NEW_SECRET" >> "$CONF_FILE"
fi

systemctl restart coturn

cat <<EOT
Rotation complete.
- New shared secret: $NEW_SECRET

Next steps:
- Update your backend provider secret (e.g., Render/Vercel) with the new value for TURN_SHARED_SECRET.
- Consider scheduling a short maintenance window if you rotate frequently.
EOT
