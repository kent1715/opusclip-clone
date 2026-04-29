import { Client } from 'ssh2';
import fs from 'fs';

const EC2_HOST = '18.221.5.26';
const EC2_USER = 'ubuntu';
const KEY_PATH = '/home/z/.ssh/ec2-key.pem';
const REMOTE_DIR = '/home/ubuntu/opusclip-clone';

const commands = [
  // Check the .next output and how the app is being run
  `cd ${REMOTE_DIR} && ls -la .next/server/app/ 2>&1 | head -20`,
  `cd ${REMOTE_DIR} && cat .next/BUILD_ID 2>&1`,
  `cd ${REMOTE_DIR} && ls -la .next/standalone/ 2>&1 | head -10`,
  // Check if it's running with next dev or the built output
  `cd ${REMOTE_DIR} && npx pm2 show opusclip 2>&1 | head -30`,
  // Check ecosystem config
  `cd ${REMOTE_DIR} && cat ecosystem.config.js 2>&1 || echo "No ecosystem config"`,
  // Check the actual DATABASE_URL being used
  `cd ${REMOTE_DIR} && ls -la db/ 2>&1`,
  // Check if prisma client was generated
  `cd ${REMOTE_DIR} && ls -la node_modules/.prisma/client/ 2>&1 | head -5`,
  // Check .env file content
  `cd ${REMOTE_DIR} && cat .env 2>&1`,
  // Look for any error in the build output
  `cd ${REMOTE_DIR} && ls -la .next/server/chunks/ 2>&1 | wc -l`,
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
