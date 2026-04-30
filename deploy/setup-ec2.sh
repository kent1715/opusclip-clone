#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# OpusClip Clone - EC2 Instance Setup Script
# Run this script ONCE on a fresh EC2 instance (Ubuntu 22.04/24.04)
# Usage: chmod +x setup-ec2.sh && sudo ./setup-ec2.sh
# ═══════════════════════════════════════════════════════════════════════════════

set -e

# ─── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; }
info() { echo -e "${CYAN}[INFO]${NC} $1"; }

# ─── Configuration ───────────────────────────────────────────────────────────
APP_NAME="opusclip"
APP_DIR="/opt/$APP_NAME"
APP_USER="opusclip"
NODE_VERSION="20"

log "Starting EC2 setup for OpusClip Clone..."
log "App directory: $APP_DIR"
log "App user: $APP_USER"
echo ""

# ─── 1. System Update ───────────────────────────────────────────────────────
log "Step 1/8: Updating system packages..."
apt-get update -y
apt-get upgrade -y
log "System updated."

# ─── 2. Install Essential Tools ──────────────────────────────────────────────
log "Step 2/8: Installing essential tools..."
apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  build-essential \
  software-properties-common \
  ca-certificates \
  gnupg \
  htop \
  ufw \
  jq
log "Essential tools installed."

# ─── 3. Install Node.js ─────────────────────────────────────────────────────
log "Step 3/8: Installing Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi

node --version
npm --version
log "Node.js installed."

# ─── 4. Install FFmpeg ──────────────────────────────────────────────────────
log "Step 4/8: Installing FFmpeg..."
if ! command -v ffmpeg &> /dev/null; then
  apt-get install -y ffmpeg
fi
ffmpeg -version | head -1
log "FFmpeg installed."

# ─── 5. Install yt-dlp ──────────────────────────────────────────────────────
log "Step 5/8: Installing yt-dlp..."
if ! command -v yt-dlp &> /dev/null; then
  curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  chmod a+rx /usr/local/bin/yt-dlp
fi
yt-dlp --version
log "yt-dlp installed."

# ─── 6. Install Python3 + Whisper (optional but recommended) ────────────────
log "Step 6/8: Installing Python3 and Whisper..."
apt-get install -y python3 python3-pip python3-venv

WHISPER_VENV="/opt/whisper-venv"
if [ ! -d "$WHISPER_VENV" ]; then
  python3 -m venv "$WHISPER_VENV"
fi

if ! "$WHISPER_VENV/bin/python" -c "import faster_whisper" 2>/dev/null; then
  "$WHISPER_VENV/bin/pip" install --upgrade pip
  "$WHISPER_VENV/bin/pip" install faster-whisper
  info "Whisper installed in virtual environment at $WHISPER_VENV"
fi

log "Python3 + Whisper installed."

# ─── 7. Create App User & Directory ─────────────────────────────────────────
log "Step 7/8: Setting up application user and directory..."

if ! id "$APP_USER" &>/dev/null; then
  useradd -r -m -s /bin/bash "$APP_USER"
fi

mkdir -p "$APP_DIR"/{upload,download,data,logs}
log "App directory created at $APP_DIR"

# ─── 8. Install PM2 + Nginx ─────────────────────────────────────────────────
log "Step 8/8: Installing PM2 and Nginx..."

npm install -g pm2

if ! command -v nginx &> /dev/null; then
  apt-get install -y nginx
fi

log "PM2 and Nginx installed."

# ─── Firewall Setup ─────────────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw --force enable
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3000/tcp
ufw status
log "Firewall configured."

# ─── Summary ─────────────────────────────────────────────────────────────────
echo ""
echo "==============================================================="
echo -e "${GREEN}  EC2 Setup Complete!${NC}"
echo "==============================================================="
echo ""
echo "  Installed:"
echo "    Node.js $(node --version)"
echo "    FFmpeg, yt-dlp, Python3, Whisper, PM2, Nginx"
echo ""
echo "  Next steps:"
echo "    1. Run: ./deploy.sh"
echo "    2. Configure .env in $APP_DIR"
echo "    3. Run: ./setup-nginx.sh"
echo ""
echo "==============================================================="
