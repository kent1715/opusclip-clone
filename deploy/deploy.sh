#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# OpusClip Clone - Deploy Script
# Run this on EC2 to deploy/update the application
# Usage: ./deploy.sh [branch]
# ═══════════════════════════════════════════════════════════════════════════════

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# ─── Configuration ───────────────────────────────────────────────────────────
APP_NAME="opusclip"
APP_DIR="/opt/$APP_NAME"
REPO_URL="https://github.com/kent1715/opusclip-clone.git"
BRANCH="${1:-main}"
APP_USER="opusclip"
NODE_OPTIONS="--max-old-space-size=4096"

# ─── Step 1: Clone or Update Repository ──────────────────────────────────────
log "Step 1/5: Fetching latest code (branch: $BRANCH)..."

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git reset --hard "origin/$BRANCH"
  log "Repository updated."
else
  # First time: clone the repo
  if [ -d "$APP_DIR" ]; then
    # Backup existing data
    mv "$APP_DIR" "${APP_DIR}-backup-$(date +%Y%m%d%H%M%S)"
  fi
  git clone -b "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
  log "Repository cloned."
fi

# ─── Step 2: Install Dependencies ───────────────────────────────────────────
log "Step 2/5: Installing dependencies..."
export NODE_OPTIONS="$NODE_OPTIONS"
npm ci --production=false 2>/dev/null || npm install
log "Dependencies installed."

# ─── Step 3: Setup Environment ──────────────────────────────────────────────
log "Step 3/5: Setting up environment..."

if [ ! -f "$APP_DIR/.env" ]; then
  if [ -f "$APP_DIR/.env.example" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    warn "Created .env from .env.example — PLEASE EDIT IT WITH YOUR CONFIG!"
    warn "Run: nano $APP_DIR/.env"
  else
    # Create a minimal .env
    cat > "$APP_DIR/.env" << 'ENVEOF'
# Database
DATABASE_URL="file:./data/production.db"

# Base URL — CHANGE THIS to your EC2 public IP or domain
NEXT_PUBLIC_BASE_URL="http://YOUR_EC2_PUBLIC_IP:3000"

# Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# GitHub OAuth
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# Stripe
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=""

# SMTP Email (optional — for forgot password)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="OpusClip <noreply@opusclip.app>"
ENVEOF
    warn "Created minimal .env — PLEASE EDIT IT!"
    warn "Run: nano $APP_DIR/.env"
  fi
else
  log ".env file already exists, keeping it."
fi

# ─── Step 4: Build ──────────────────────────────────────────────────────────
log "Step 4/5: Building application..."
export NODE_OPTIONS="$NODE_OPTIONS"

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push

# Build Next.js
npm run build

log "Build complete."

# ─── Step 5: Set Permissions & Start ────────────────────────────────────────
log "Step 5/5: Setting permissions and starting application..."

# Set ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Create required directories with proper permissions
mkdir -p "$APP_DIR"/{upload,download,data,logs}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"/{upload,download,data,logs}

# ─── Start with PM2 ─────────────────────────────────────────────────────────
cd "$APP_DIR"

# Check if ecosystem.config.js exists
if [ ! -f "$APP_DIR/ecosystem.config.js" ]; then
  cat > "$APP_DIR/ecosystem.config.js" << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'opusclip',
      script: 'node_modules/.bin/next',
      args: 'start -p 3000',
      cwd: '/opt/opusclip',
      env: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=4096',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '2G',
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
      error_file: '/opt/opusclip/logs/error.log',
      out_file: '/opt/opusclip/logs/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
PM2EOF
fi

chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"

# Start or reload PM2
if pm2 describe "$APP_NAME" &>/dev/null; then
  pm2 reload "$APP_NAME" --update-env
  log "Application reloaded."
else
  sudo -u "$APP_USER" pm2 start ecosystem.config.js
  log "Application started."
fi

# Save PM2 process list
pm2 save

# Show status
pm2 status

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "==============================================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "==============================================================="
echo ""
echo "  App running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP'):3000"
echo ""
echo "  Useful commands:"
echo "    pm2 status              # Check app status"
echo "    pm2 logs opusclip       # View logs"
echo "    pm2 restart opusclip    # Restart app"
echo "    pm2 stop opusclip       # Stop app"
echo "    nano $APP_DIR/.env      # Edit environment variables"
echo ""
echo "  Next: Run ./setup-nginx.sh for reverse proxy + SSL"
echo "==============================================================="
