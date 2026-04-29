import { db } from '../src/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seed() {
  console.log('🌱 Seeding database...');

  // ─── Create Admin User ────────────────────────────────────────────────────
  const adminEmail = 'admin@opusclip.com';
  const adminPassword = 'admin123';

  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const admin = await db.user.create({
      data: {
        email: adminEmail,
        name: 'Admin OpusClip',
        password: hashPassword(adminPassword),
        role: 'admin',
        plan: 'business',
        clipsUsed: 3,
        clipsLimit: 999,
        image: null,
      },
    });
    console.log(`  ✅ Created admin user: ${adminEmail} / ${adminPassword}`);

    // ─── Create Sample Videos for Admin ───────────────────────────────────
    const video1 = await db.video.create({
      data: {
        userId: admin.id,
        sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up - Rick Astley',
        thumbnailUrl: null,
        duration: '3:33',
        status: 'completed',
      },
    });

    const video2 = await db.video.create({
      data: {
        userId: admin.id,
        sourceUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        title: 'Me at the zoo - First YouTube Video Ever',
        thumbnailUrl: null,
        duration: '0:19',
        status: 'completed',
      },
    });

    const video3 = await db.video.create({
      data: {
        userId: admin.id,
        sourceUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        title: 'PSY - GANGNAM STYLE',
        thumbnailUrl: null,
        duration: '4:13',
        status: 'completed',
      },
    });

    console.log(`  ✅ Created 3 sample videos for admin`);

    // ─── Create Sample Clips for Admin Videos ─────────────────────────────
    const clipData = [
      // Video 1 clips
      { videoId: video1.id, title: 'The Iconic Opening Hook', startTime: '0:00', duration: '0:30', viralityScore: 97, captions: 'Never gonna give you up|Never gonna let you down|Never gonna run around and desert you', captionStyle: 'default', layout: '9:16', tags: JSON.stringify(['viral', 'classic', 'meme']) },
      { videoId: video1.id, title: 'The Chorus Everyone Knows', startTime: '0:45', duration: '0:45', viralityScore: 95, captions: 'Never gonna give you up|Never gonna let you down|Never gonna say goodbye', captionStyle: 'bold', layout: '9:16', tags: JSON.stringify(['trending', 'music', 'hook']) },
      { videoId: video1.id, title: 'The Dance Break', startTime: '1:30', duration: '0:35', viralityScore: 89, captions: 'A commitment to love|A full guarantee|Never gonna give you up', captionStyle: 'karaoke', layout: '1:1', tags: JSON.stringify(['dance', 'viral']) },
      { videoId: video1.id, title: 'Bridge Section', startTime: '2:10', duration: '0:28', viralityScore: 82, captions: 'Inside we both know|What\'s been going on|We know the game', captionStyle: 'outline', layout: '16:9', tags: JSON.stringify(['nostalgia', 'classic']) },
      { videoId: video1.id, title: 'Final Chorus Finale', startTime: '2:50', duration: '0:43', viralityScore: 91, captions: 'Never gonna give you up|Never gonna let you down|Never gonna run around', captionStyle: 'default', layout: '9:16', tags: JSON.stringify(['finale', 'viral', 'music']) },

      // Video 2 clips
      { videoId: video2.id, title: 'The Very First YouTube Moment', startTime: '0:00', duration: '0:15', viralityScore: 99, captions: 'The first YouTube video ever|Historic internet moment', captionStyle: 'default', layout: '9:16', tags: JSON.stringify(['historic', 'first', 'youtube']) },
      { videoId: video2.id, title: 'At The Zoo', startTime: '0:05', duration: '0:14', viralityScore: 88, captions: 'Here I am at the zoo|Pretty cool elephants', captionStyle: 'bold', layout: '1:1', tags: JSON.stringify(['zoo', 'viral']) },

      // Video 3 clips
      { videoId: video3.id, title: 'The Iconic Dance Move', startTime: '0:28', duration: '0:40', viralityScore: 96, captions: 'Oppa Gangnam Style|The most viewed dance|In the world', captionStyle: 'karaoke', layout: '9:16', tags: JSON.stringify(['dance', 'viral', 'kpop']) },
      { videoId: video3.id, title: 'Horse Dance Scene', startTime: '1:05', duration: '0:35', viralityScore: 93, captions: 'Riding the invisible horse|Gangnam Style everyone', captionStyle: 'default', layout: '9:16', tags: JSON.stringify(['iconic', 'dance']) },
      { videoId: video3.id, title: 'Chorus Drop', startTime: '0:50', duration: '0:45', viralityScore: 90, captions: 'Oppa Gangnam Style|Eh Sexy Lady|Oppa Gangnam Style', captionStyle: 'bold', layout: '1:1', tags: JSON.stringify(['music', 'viral', 'kpop']) },
      { videoId: video3.id, title: 'Yoga Scene', startTime: '2:30', duration: '0:30', viralityScore: 85, captions: 'Dance off scene|Energetic moves|Great vibes', captionStyle: 'outline', layout: '16:9', tags: JSON.stringify(['funny', 'scene']) },
      { videoId: video3.id, title: 'Final Dance Sequence', startTime: '3:30', duration: '0:43', viralityScore: 87, captions: 'The grand finale|Everyone dancing together', captionStyle: 'default', layout: '9:16', tags: JSON.stringify(['finale', 'dance', 'group']) },
    ];

    for (const clip of clipData) {
      await db.clip.create({ data: clip });
    }
    console.log(`  ✅ Created ${clipData.length} sample clips for admin`);
  } else {
    console.log(`  ⏭️  Admin user already exists: ${adminEmail}`);
    // Update existing admin to make sure role and plan are set
    await db.user.update({
      where: { id: existingAdmin.id },
      data: {
        role: 'admin',
        plan: 'business',
        clipsLimit: 999,
      },
    });
    console.log(`  ✅ Updated existing admin user with admin role and business plan`);
  }

  // ─── Create Demo User ──────────────────────────────────────────────────
  const demoEmail = 'demo@opusclip.com';
  const demoPassword = 'demo123';

  const existingDemo = await db.user.findUnique({ where: { email: demoEmail } });

  if (!existingDemo) {
    await db.user.create({
      data: {
        email: demoEmail,
        name: 'Demo User',
        password: hashPassword(demoPassword),
        role: 'user',
        plan: 'free',
        clipsUsed: 0,
        clipsLimit: 5,
        image: null,
      },
    });
    console.log(`  ✅ Created demo user: ${demoEmail} / ${demoPassword}`);
  } else {
    console.log(`  ⏭️  Demo user already exists: ${demoEmail}`);
  }

  // ─── Create Default Templates ──────────────────────────────────────────
  const templates = [
    {
      name: 'Modern Pink',
      description: 'Bold pink gradient with clean typography',
      colors: JSON.stringify({ primary: '#ff3e96', secondary: '#7b2ff7', bg: '#0a0a0f', text: '#ffffff' }),
      font: 'Inter',
      logoPosition: 'bottom-right',
      captionStyle: 'default',
      layout: '9:16',
      isDefault: true,
    },
    {
      name: 'Neon Glow',
      description: 'Cyberpunk-inspired neon colors with glow effects',
      colors: JSON.stringify({ primary: '#00d4ff', secondary: '#7b2ff7', bg: '#0d0d14', text: '#f0f0f5' }),
      font: 'Inter',
      logoPosition: 'top-left',
      captionStyle: 'outline',
      layout: '9:16',
      isDefault: true,
    },
    {
      name: 'Clean Minimal',
      description: 'White text on dark background, minimal design',
      colors: JSON.stringify({ primary: '#ffffff', secondary: '#888888', bg: '#000000', text: '#ffffff' }),
      font: 'Inter',
      logoPosition: 'bottom-left',
      captionStyle: 'bold',
      layout: '9:16',
      isDefault: true,
    },
    {
      name: 'Karaoke Style',
      description: 'Highlighted caption style perfect for music and entertainment',
      colors: JSON.stringify({ primary: '#ffd700', secondary: '#ff3e96', bg: '#0a0a0f', text: '#ffffff' }),
      font: 'Poppins',
      logoPosition: 'bottom-center',
      captionStyle: 'karaoke',
      layout: '9:16',
      isDefault: true,
    },
    {
      name: 'Square Social',
      description: '1:1 square format optimized for Instagram',
      colors: JSON.stringify({ primary: '#ff3e96', secondary: '#ffd700', bg: '#12121a', text: '#ffffff' }),
      font: 'Inter',
      logoPosition: 'bottom-right',
      captionStyle: 'default',
      layout: '1:1',
      isDefault: true,
    },
    {
      name: 'Landscape Pro',
      description: '16:9 landscape format for YouTube and LinkedIn',
      colors: JSON.stringify({ primary: '#7b2ff7', secondary: '#00d4ff', bg: '#0a0a0f', text: '#ffffff' }),
      font: 'Inter',
      logoPosition: 'top-right',
      captionStyle: 'default',
      layout: '16:9',
      isDefault: true,
    },
  ];

  for (const template of templates) {
    const existing = await db.template.findFirst({ where: { name: template.name, isDefault: true } });
    if (!existing) {
      await db.template.create({ data: template });
      console.log(`  ✅ Created template: ${template.name}`);
    } else {
      console.log(`  ⏭️  Template already exists: ${template.name}`);
    }
  }

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Test Accounts:');
  console.log('  👑 Admin: admin@opusclip.com / admin123');
  console.log('  👤 Demo:  demo@opusclip.com / demo123');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
