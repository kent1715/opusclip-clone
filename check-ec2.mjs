import { Client } from 'ssh2';
import fs from 'fs';

const EC2_HOST = '18.221.5.26';
const EC2_USER = 'ubuntu';
const KEY_PATH = '/home/z/.ssh/ec2-key.pem';
const REMOTE_DIR = '/home/ubuntu/opusclip-clone';

const commands = [
  `cd ${REMOTE_DIR} && npx pm2 logs opusclip --lines 50 --nostream 2>&1`,
  `cd ${REMOTE_DIR} && cat .next/server/chunks/*.js 2>/dev/null | head -1 || echo "No chunks"`,
  `cd ${REMOTE_DIR} && ls -la .next/ 2>&1 | head -20`,
  `cd ${REMOTE_DIR} && cat .env 2>&1`,
  `cd ${REMOTE_DIR} && cat next.config.* 2>&1`,
  `cd ${REMOTE_DIR} && cat server.js 2>&1`,
  `cd ${REMOTE_DIR} && node -e "try { require('./.next/server/chunks/[root-of-the-server]__*.js'); console.log('OK'); } catch(e) { console.log(e.message); }" 2>&1 || echo "Failed"`,
];

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to EC2!');
  let cmdIndex = 0;

  const runNext = () => {
    if (cmdIndex >= commands.length) {
      console.log('\nDone!');
      conn.end();
      return;
    }
    const cmd = commands[cmdIndex];
    console.log(`\n===== [${cmdIndex + 1}/${commands.length}] =====`);
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(`Error: ${err.message}`); cmdIndex++; runNext(); return; }
      stream.on('data', (data) => process.stdout.write(data.toString()));
      stream.on('stderr', (data) => process.stderr.write(data.toString()));
      stream.on('close', () => { cmdIndex++; runNext(); });
    });
  };
  runNext();
});

conn.on('error', (err) => console.error('Connection error:', err.message));
conn.connect({ host: EC2_HOST, port: 22, username: EC2_USER, privateKey: fs.readFileSync(KEY_PATH, 'utf8') });
