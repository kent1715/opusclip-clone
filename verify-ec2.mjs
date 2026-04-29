import { Client } from 'ssh2';
import fs from 'fs';

const EC2_HOST = '18.221.5.26';
const EC2_USER = 'ubuntu';
const KEY_PATH = '/home/z/.ssh/ec2-key.pem';
const REMOTE_DIR = '/home/ubuntu/opusclip-clone';

const commands = [
  // Check the page loads
  `curl -s http://localhost:3000 | head -5`,
  // Check the API
  `curl -s http://localhost:3000/api/auth/me`,
  // Check error logs
  `cd ${REMOTE_DIR} && npx pm2 logs opusclip --lines 10 --nostream 2>&1`,
  // Verify the .env in standalone
  `cat ${REMOTE_DIR}/.next/standalone/.env`,
  // Verify the new build ID
  `cat ${REMOTE_DIR}/.next/BUILD_ID`,
];

const conn = new Client();

conn.on('ready', () => {
  console.log('Connected to EC2!');
  let cmdIndex = 0;

  const runNext = () => {
    if (cmdIndex >= commands.length) {
      console.log('\nAll done!');
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
