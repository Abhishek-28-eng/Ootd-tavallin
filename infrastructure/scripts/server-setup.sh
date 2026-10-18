#!/bin/bash
# ============================================================
# Tavallin EC2 Ubuntu Server Bootstrap Script
# Run once on a fresh Ubuntu 22.04 EC2 instance as ubuntu user
# Usage: bash server-setup.sh
# ============================================================

set -euo pipefail

DOMAIN="devwithabhi.de"
API_SUBDOMAIN="server.${DOMAIN}"
ADMIN_SUBDOMAIN="panel.${DOMAIN}"
EMAIL="abhishektalole47@gmail.com"
APP_DIR="/opt/tavallin"

echo "============================================================"
echo "🚀 Tavallin Server Bootstrap"
echo "============================================================"

# ─── 1. System Update ─────────────────────────────────────────
echo ""
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get upgrade -y
sudo apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  ufw \
  fail2ban \
  htop

# ─── 2. Install Docker ────────────────────────────────────────
echo ""
echo "🐳 Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  sudo usermod -aG docker $USER
  rm get-docker.sh
  echo "✅ Docker installed"
else
  echo "✅ Docker already installed"
fi

# Install Docker Compose plugin
if ! docker compose version &>/dev/null 2>&1; then
  sudo apt-get install -y docker-compose-plugin
  echo "✅ Docker Compose plugin installed"
else
  echo "✅ Docker Compose already installed"
fi

# ─── 3. Firewall Setup ────────────────────────────────────────
echo ""
echo "🔒 Configuring UFW firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
echo "✅ Firewall configured"

# ─── 4. Create App Directory ──────────────────────────────────
echo ""
echo "📁 Creating app directory at ${APP_DIR}..."
sudo mkdir -p ${APP_DIR}
sudo chown -R $USER:$USER ${APP_DIR}
mkdir -p ${APP_DIR}/infrastructure/nginx/conf.d
echo "✅ App directory ready"

# ─── 5. Initial Nginx HTTP-only config (before SSL) ──────────
echo ""
echo "🌐 Creating initial HTTP-only Nginx config for Certbot challenge..."
sudo mkdir -p ${APP_DIR}/infrastructure/nginx/conf.d

cat > ${APP_DIR}/infrastructure/nginx/conf.d/tavallin-init.conf << EOF
server {
    listen 80;
    server_name ${API_SUBDOMAIN} ${ADMIN_SUBDOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 200 'Server is running. SSL setup in progress.';
        add_header Content-Type text/plain;
    }
}
EOF

# ─── 6. SSL Certificate via Let's Encrypt ─────────────────────
echo ""
echo "🔐 Obtaining SSL certificates via Let's Encrypt..."
echo "Make sure DNS A records point to this server IP before proceeding!"
echo ""
echo "DNS Check:"
echo "  ${API_SUBDOMAIN}   → $(dig +short ${API_SUBDOMAIN} 2>/dev/null || echo 'NOT RESOLVED YET')"
echo "  ${ADMIN_SUBDOMAIN} → $(dig +short ${ADMIN_SUBDOMAIN} 2>/dev/null || echo 'NOT RESOLVED YET')"
echo ""

# Start a temporary certbot container to get certs
docker run --rm \
  -v /opt/tavallin/certbot_www:/var/www/certbot \
  -v /opt/tavallin/certbot_certs:/etc/letsencrypt \
  -p 80:80 \
  certbot/certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  -d "${API_SUBDOMAIN}" \
  -d "${ADMIN_SUBDOMAIN}" \
  || echo "⚠️  SSL cert generation failed. You may need to run this manually after DNS propagates."

# ─── 7. Create systemd service for auto-start ─────────────────
echo ""
echo "⚙️  Creating systemd service..."
sudo tee /etc/systemd/system/tavallin.service > /dev/null << EOF
[Unit]
Description=Tavallin Docker Compose Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f ${APP_DIR}/docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable tavallin
echo "✅ Systemd service configured"

# ─── 8. Deploy key message ────────────────────────────────────
echo ""
echo "============================================================"
echo "✅ Server Bootstrap Complete!"
echo "============================================================"
echo ""
echo "Next steps:"
echo "1. Add DNS A records in your domain registrar:"
echo "   ${API_SUBDOMAIN}   → $(curl -s ifconfig.me)"
echo "   ${ADMIN_SUBDOMAIN} → $(curl -s ifconfig.me)"
echo ""
echo "2. Configure GitHub Secrets (Settings → Secrets → Actions):"
echo "   EC2_HOST              = $(curl -s ifconfig.me)"
echo "   EC2_USER              = ubuntu"
echo "   EC2_SSH_KEY           = <your private key content>"
echo "   DB_NAME               = tavallin_prod"
echo "   DB_USER               = tavallin"
echo "   DB_PASSWORD           = <strong password>"
echo "   DB_ROOT_PASSWORD      = <strong root password>"
echo "   JWT_ACCESS_SECRET     = <64 char random string>"
echo "   JWT_REFRESH_SECRET    = <64 char random string>"
echo "   STORAGE_BUCKET        = tavallin-media-prod"
echo "   STORAGE_REGION        = ap-south-1"
echo "   STORAGE_ACCESS_KEY_ID = <from .env>"
echo "   STORAGE_SECRET_ACCESS_KEY = <from .env>"
echo "   STORAGE_PUBLIC_BASE_URL   = <S3 public URL>"
echo "   ADMIN_BOOTSTRAP_EMAIL     = admin@tavallin.com"
echo "   ADMIN_BOOTSTRAP_PASSWORD  = <strong password>"
echo "   EXPO_TOKEN            = <from expo.dev account settings>"
echo ""
echo "3. Push to main branch to trigger deployment!"
echo ""
echo "4. After deployment, seed 20 dummy users by:"
echo "   - Running the workflow manually with 'Seed dummy users' = true"
echo "   - OR SSH and run: docker compose -f /opt/tavallin/docker-compose.prod.yml exec api sh -c 'cd /app/apps/api && npx tsx src/database/seed_dummy_users.ts'"
echo ""
