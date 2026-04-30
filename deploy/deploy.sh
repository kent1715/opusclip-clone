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
APP_USER="ubuntu"
NODE_OPTIONS="--max-old-space-size=4096"
STANDALONE_DIR="$APP_DIR/.next/standalone"
WHISPER_VENV="/opt/whisper-venv"

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
log "Step 5/6: Setting permissions and post-build setup..."

# Set ownership
chown -R "$APP_USER:$APP_USER" "$APP_DIR"

# Create required directories with proper permissions
mkdir -p "$APP_DIR"/{upload,download,data,logs,db}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"/{upload,download,data,logs,db}

# ─── Copy essential files to standalone directory ───────────────────────────
log "Copying essential files to standalone directory..."

# Copy mini-services (for Whisper transcription)
cp -r "$APP_DIR/mini-services" "$STANDALONE_DIR/" 2>/dev/null || true

# Copy public folder
cp -r "$APP_DIR/public" "$STANDALONE_DIR/" 2>/dev/null || true

# Copy .env.local if it exists
cp "$APP_DIR/.env.local" "$STANDALONE_DIR/.env.local" 2>/dev/null || true
cp "$APP_DIR/.env" "$STANDALONE_DIR/.env" 2>/dev/null || true

# Copy .env.production if it exists
cp "$APP_DIR/.env.production" "$STANDALONE_DIR/.env.production" 2>/dev/null || true

# Create db directory in standalone
mkdir -p "$STANDALONE_DIR/db"
cp "$APP_DIR/db/"*.db "$STANDALONE_DIR/db/" 2>/dev/null || true

chown -R "$APP_USER:$APP_USER" "$STANDALONE_DIR"

# ─── Setup Whisper virtual environment ──────────────────────────────────────
log "Setting up Whisper transcription environment..."

if [ ! -d "$WHISPER_VENV" ]; then
  python3 -m venv "$WHISPER_VENV"
  "$WHISPER_VENV/bin/pip" install --upgrade pip
  "$WHISPER_VENV/bin/pip" install faster-whisper
  info "Whisper venv created at $WHISPER_VENV"
else
  # Ensure faster-whisper is installed
  if ! "$WHISPER_VENV/bin/python" -c "import faster_whisper" 2>/dev/null; then
    "$WHISPER_VENV/bin/pip" install --upgrade pip
    "$WHISPER_VENV/bin/pip" install faster-whisper
    info "faster-whisper installed in existing venv"
  fi
fi

chown -R "$APP_USER:$APP_USER" "$WHISPER_VENV"

# ─── Install systemd service ────────────────────────────────────────────────
log "Step 6/6: Installing systemd service..."

cp "$APP_DIR/deploy/opusclip.service" /etc/systemd/system/opusclip.service
systemctl daemon-reload
systemctl enable opusclip

# Stop PM2 if running
if command -v pm2 &>/dev/null && pm2 describe "$APP_NAME" &>/dev/null 2>&1; then
  pm2 stop "$APP_NAME" 2>/dev/null || true
  pm2 delete "$APP_NAME" 2>/dev/null || true
  pm2 save 2>/dev/null || true
fi

# Start with systemd
systemctl restart opusclip
sleep 3
systemctl status opusclip --no-pager || true

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "==============================================================="
echo -e "${GREEN}  Deployment Complete!${NC}"
echo "==============================================================="
echo ""
echo "  App running at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'YOUR_EC2_IP'):3000"
echo ""
echo "  Useful commands:"
echo "    sudo systemctl status opusclip   # Check app status"
echo "    sudo journalctl -u opusclip -f   # View logs"
echo "    sudo systemctl restart opusclip  # Restart app"
echo "    sudo systemctl stop opusclip     # Stop app"
echo "    nano $APP_DIR/.env               # Edit environment variables"
echo ""
echo "  Next: Run ./setup-nginx.sh for reverse proxy + SSL"
echo "==============================================================="
