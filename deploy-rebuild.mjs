import { Client } from 'ssh2';
import fs from 'fs';

const EC2_HOST = '18.221.5.26';
const EC2_USER = 'ubuntu';
const KEY_PATH = '/home/z/.ssh/ec2-key.pem';
const REMOTE_DIR = '/home/ubuntu/opusclip-clone';

// We need to rebuild the app on EC2 since it uses standalone build
const commands = [
  // Check if bun is available
  `which bun || which npm || which node`,
  // Check node version
  `node --version`,
  // Install dependencies  
  `cd ${REMOTE_DIR} && npm install --legacy-peer-deps 2>&1 | tail -5`,
  // Fix the DATABASE_URL in .env before building
  `cd ${REMOTE_DIR} && echo 'DATABASE_URL=file:./db/custom.db' > .env`,
  // Generate Prisma client
  `cd ${REMOTE_DIR} && npx prisma generate 2>&1 | tail -5`,
  // Run the build
  `cd ${REMOTE_DIR} && npm run build 2>&1 | tail -20`,
  // Fix the .env in standalone output
  `cd ${REMOTE_DIR} && echo 'DATABASE_URL=file:./db/custom.db' > .next/standalone/.env`,
  // Copy static files to standalone
  `cd ${REMOTE_DIR} && cp -r .next/static .next/standalone/.next/static && cp -r public .next/standalone/public 2>&1`,
  // Copy db folder
  `cd ${REMOTE_DIR} && mkdir -p .next/standalone/db && cp db/custom.db .next/standalone/db/ 2>&1`,
  // Copy prisma schema for client
  `cd ${REMOTE_DIR} && mkdir -p .next/standalone/prisma && cp prisma/schema.prisma .next/standalone/prisma/ 2>&1`,
  // Restart PM2
  `cd ${REMOTE_DIR} && npx pm2 restart opusclip 2>&1`,
  // Wait and check
  `sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>&1`,
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
    console.log(`\n===== [${cmdIndex + 1}/${commands.length}] ${cmd.substring(0, 80)}... =====`);
    
    conn.exec(cmd, (err, stream) => {
      if (err) { console.error(`Error: ${err.message}`); cmdIndex++; runNext(); return; }
      stream.on('data', (data) => process.stdout.write(data.toString()));
      stream.on('stderr', (data) => process.stderr.write(data.toString()));
      stream.on('close', (code) => {
        console.log(`[Exit: ${code}]`);
        cmdIndex++;
        runNext();
      });
    });
  };
  runNext();
});

conn.on('error', (err) => console.error('Connection error:', err.message));
conn.connect({ host: EC2_HOST, port: 22, username: EC2_USER, privateKey: fs.readFileSync(KEY_PATH, 'utf8') });
