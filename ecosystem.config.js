module.exports = {
  apps: [{
    name: 'opusclip',
    script: '/home/ubuntu/.bun/bin/bun',
    args: 'run dev',
    cwd: '/home/ubuntu/opusclip-clone',
    env: {
      NODE_OPTIONS: '--max-old-space-size=4096',
      PORT: 3000,
    },
    watch: false,
    autorestart: true,
    max_restarts: 10,
    restart_delay: 5000,
  }]
};
