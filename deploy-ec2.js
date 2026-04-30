const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const EC2_HOST = '18.221.5.26';
const EC2_USER = 'ubuntu';
const KEY_PATH = path.join(__dirname, 'upload/clipper.pem');

const commands = [
  'cd /home/ubuntu/opusclip-clone && pm2 delete opusclip 2>/dev/null; echo "cleaned"',
  'which bun && bun --version',
  // Write ecosystem config file
  `cat > /home/ubuntu/opusclip-clone/ecosystem.config.js << 'ECO_EOF'
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
ECO_EOF`,
  'cd /home/ubuntu/opusclip-clone && pm2 start ecosystem.config.js',
  'sleep 12 && pm2 status',
  'curl -s http://localhost:3000/api/process || echo "API not ready yet"',
  'pm2 save',
];

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Connected to EC2');
  
  let cmdIndex = 0;
  const runNext = () => {
    if (cmdIndex >= commands.length) {
      console.log('\n🎉 Deployment complete!');
      conn.end();
      return;
    }
    const cmd = commands[cmdIndex];
    console.log(`\n▶ Running [${cmdIndex + 1}/${commands.length}]: ${cmd.substring(0, 100)}...`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(`❌ Error: ${err.message}`);
        cmdIndex++;
        runNext();
        return;
      }
      
      stream.on('data', (data) => {
        process.stdout.write(data.toString());
      });
      stream.on('stderr', (data) => {
        process.stderr.write(data.toString());
      });
      stream.on('close', () => {
        cmdIndex++;
        runNext();
      });
    });
  };
  
  runNext();
});

conn.on('error', (err) => {
  console.error('❌ SSH Connection error:', err.message);
  process.exit(1);
});

const keyData = fs.readFileSync(KEY_PATH, 'utf8');
conn.connect({
  host: EC2_HOST,
  port: 22,
  username: EC2_USER,
  privateKey: keyData,
  readyTimeout: 30000,
});
