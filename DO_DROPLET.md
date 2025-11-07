# DigitalOcean droplet guide for coturn (one-click style)

This guide shows a small `doctl`-based workflow to create a droplet, set the DNS A record, and run the `scripts/setup_coturn.sh` script remotely.

Prerequisites
- `doctl` installed and authenticated: https://docs.digitalocean.com/reference/doctl/how-to/install/
- An SSH key added to your DigitalOcean account
- Domain DNS managed at your registrar and editable

1) Create a droplet (small, Ubuntu 22.04)

```bash
# Replace values
DROPLET_NAME=turn-droplet
REGION=nyc3
SIZE=s-1vcpu-1gb
IMAGE=ubuntu-22-04-x64
SSH_KEY_FINGERPRINT="$(doctl compute ssh-key list --no-header | awk '{print $2}')"

# Create droplet
doctl compute droplet create $DROPLET_NAME --region $REGION --size $SIZE --image $IMAGE --ssh-keys "$SSH_KEY_FINGERPRINT" --wait --format ID,PublicIPv4,Name
```

2) Reserve a Floating IP (optional)

```bash
doctl compute floating-ip-action create $REGION
# or assign existing floating IP to droplet
# doctl compute floating-ip-action assign <FLOATING_IP> <DROPLET_ID>
```

3) Add DNS A record (point turn.your-domain to droplet IP)

```bash
# Replace with your domain and desired subdomain
DOMAIN=your-domain.com
SUBDOMAIN=turn
DROPLET_IP=$(doctl compute droplet list --format PublicIPv4 --no-header | head -n1)

doctl compute domain records create $DOMAIN --record-type A --record-name $SUBDOMAIN --record-data $DROPLET_IP
```

4) Copy `scripts/setup_coturn.sh` to the droplet and run it

```bash
# Copy script
scp -i ~/.ssh/id_rsa scripts/setup_coturn.sh ubuntu@$DROPLET_IP:/home/ubuntu/

# Run the script remotely (the script will use certbot standalone which requires ports 80/443 free)
ssh -i ~/.ssh/id_rsa ubuntu@$DROPLET_IP 'sudo bash /home/ubuntu/setup_coturn.sh turn.your-domain.com "$(openssl rand -base64 24)"'
```

Notes & troubleshooting
- If certbot fails to obtain a certificate, ensure port 80 is free and DNS has propagated for your domain.
- You can run the script interactively and inspect `/etc/turnserver.conf.d/00-coturn.conf` after completion.
- Remember to store the shared secret in your backend provider as `TURN_SHARED_SECRET`.

Security
- Use a firewall and only open the ports necessary for coturn (3478/5349 and relay range).
- Use `TURN_SHARED_SECRET` and ephemeral credentials rather than static TURN usernames/passwords whenever possible.

If you want, I can add a cloud-init template or a `doctl` one-liner that creates the droplet and runs the script in one step.
