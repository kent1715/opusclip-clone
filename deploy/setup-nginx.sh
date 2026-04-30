#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# OpusClip Clone - Nginx + SSL Setup
# Configures Nginx as reverse proxy with optional Let's Encrypt SSL
# Usage: sudo ./setup-nginx.sh [domain]
# Example: sudo ./setup-nginx.sh opusclip.yourdomain.com
# If no domain provided, sets up HTTP-only with EC2 public IP
# ═══════════════════════════════════════════════════════════════════════════════

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[NGINX]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
info()  { echo -e "${CYAN}[INFO]${NC} $1"; }

DOMAIN="${1:-}"
APP_NAME="opusclip"
APP_PORT=3000

# Get EC2 public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "YOUR_EC2_IP")
SERVER_NAME="${DOMAIN:-$PUBLIC_IP}"

log "Setting up Nginx for: $SERVER_NAME"

# ─── Nginx Configuration ────────────────────────────────────────────────────
log "Writing Nginx configuration..."

cat > /etc/nginx/sites-available/$APP_NAME << NGINXEOF
# Upstream to Next.js app
upstream $APP_NAME {
    server 127.0.0.1:$APP_PORT;
    keepalive 64;
}

server {
    listen 80;
    server_name $SERVER_NAME;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Client max body size (for video uploads — 500MB)
    client_max_body_size 500M;

    # Timeouts for long-running processes (video processing)
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Next.js static files (cache aggressively)
    location /_next/static/ {
        proxy_pass http://$APP_NAME;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # SSE progress endpoint (no buffering!)
    location /api/progress {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
        chunked_transfer_encoding on;
    }

    # Stripe webhook (no buffering)
    location /api/stripe/webhook {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_request_buffering off;
        client_max_body_size 5M;
    }

    # Download endpoint (streaming)
    location /api/download/ {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_buffering off;
        proxy_set_header Connection '';
    }

    # Upload serve endpoint (streaming with range support)
    location /api/upload/serve {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_set_header Range \$http_range;
        proxy_set_header If-Range \$http_if_range;
        proxy_buffering off;
    }

    # All other API routes
    location /api/ {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Default location (Next.js SSR)
    location / {
        proxy_pass http://$APP_NAME;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF

# Enable the site
ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/$APP_NAME

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx config
nginx -t

# Reload Nginx
systemctl enable nginx
systemctl reload nginx

log "Nginx configured and running on port 80."

# ─── SSL with Let's Encrypt (if domain provided) ────────────────────────────
if [ -n "$DOMAIN" ]; then
  log "Domain provided: $DOMAIN"
  log "Setting up SSL with Let's Encrypt..."

  # Install Certbot
  if ! command -v certbot &> /dev/null; then
    apt-get update -y
    apt-get install -y certbot python3-certbot-nginx
  fi

  # Obtain SSL certificate
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

  # Auto-renewal cron job
  (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | sort -u | crontab -

  log "SSL configured! App available at: https://$DOMAIN"

  # Update NEXT_PUBLIC_BASE_URL in .env
  if [ -f "/opt/$APP_NAME/.env" ]; then
    sed -i "s|NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=https://$DOMAIN|" "/opt/$APP_NAME/.env"
    info "Updated NEXT_PUBLIC_BASE_URL in .env to https://$DOMAIN"

    # Restart app to pick up new env
    pm2 restart $APP_NAME --update-env
    log "Application restarted with new environment."
  fi
else
  warn "No domain provided. HTTP-only setup."
  warn "To add SSL later, run: sudo ./setup-nginx.sh yourdomain.com"
  warn ""
  info "App available at: http://$PUBLIC_IP"

  # Update NEXT_PUBLIC_BASE_URL in .env
  if [ -f "/opt/$APP_NAME/.env" ]; then
    sed -i "s|NEXT_PUBLIC_BASE_URL=.*|NEXT_PUBLIC_BASE_URL=http://$PUBLIC_IP|" "/opt/$APP_NAME/.env"
    info "Updated NEXT_PUBLIC_BASE_URL in .env to http://$PUBLIC_IP"

    pm2 restart $APP_NAME --update-env
    log "Application restarted with new environment."
  fi
fi

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "==============================================================="
echo -e "${GREEN}  Nginx Setup Complete!${NC}"
echo "==============================================================="
echo ""
if [ -n "$DOMAIN" ]; then
  echo "  App URL: https://$DOMAIN"
else
  echo "  App URL: http://$PUBLIC_IP"
fi
echo ""
echo "  Nginx config: /etc/nginx/sites-available/$APP_NAME"
echo "  SSL cert:     $( [ -n "$DOMAIN" ] && echo '/etc/letsencrypt/live/'$DOMAIN || echo 'Not configured' )"
echo ""
echo "  Useful commands:"
echo "    nginx -t                 # Test config"
echo "    systemctl reload nginx   # Reload config"
echo "    certbot renew            # Renew SSL"
echo "    tail -f /var/log/nginx/access.log"
echo "==============================================================="
