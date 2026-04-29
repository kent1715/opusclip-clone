import { db } from '../src/lib/db';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create default templates
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

  console.log('✅ Seeding complete!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
