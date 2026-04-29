import { db } from '../src/lib/db';

async function main() {
  await db.user.update({
    where: { email: 'demo@opusclip.com' },
    data: {
      plan: 'pro',
      clipsLimit: 50,
    },
  });
  console.log('Updated demo user to pro plan with 50 clips limit');
  
  await db.$disconnect();
}

main();
