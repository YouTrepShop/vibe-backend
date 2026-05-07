import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Vibe1234!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vibe.app' },
    update: {},
    create: {
      email: 'admin@vibe.app',
      username: 'vibe',
      passwordHash: password,
      fullName: 'Vibe Team',
      bio: 'Welcome to Vibe — share your vibe ✨',
      isVerified: true,
      role: 'ADMIN',
      emailVerified: new Date(),
    },
  });

  const demos = await Promise.all(
    [
      { username: 'aria', fullName: 'Aria Nova', bio: 'Music · light · cosmos' },
      { username: 'kai', fullName: 'Kai Sato', bio: 'Skater · designer' },
      { username: 'mira', fullName: 'Mira Bloom', bio: 'Photography & travel' },
      { username: 'leo', fullName: 'Leo Park', bio: 'Coffee. Code. Repeat.' },
    ].map((u) =>
      prisma.user.upsert({
        where: { username: u.username },
        update: {},
        create: {
          username: u.username,
          email: `${u.username}@vibe.app`,
          passwordHash: password,
          fullName: u.fullName,
          bio: u.bio,
          emailVerified: new Date(),
        },
      }),
    ),
  );

  for (const u of demos) {
    await prisma.post.create({
      data: {
        userId: u.id,
        content: `Привет, я ${u.fullName}! #vibe #привет`,
        type: 'TEXT',
        hashtags: ['vibe', 'привет'],
      },
    });
  }

  // sample hashtag stats
  await prisma.hashtag.upsert({
    where: { tag: 'vibe' },
    update: { trendScore: 100, postsCount: demos.length },
    create: { tag: 'vibe', trendScore: 100, postsCount: demos.length },
  });

  console.log('Seeded admin & demo users:', admin.username, demos.map((d) => d.username));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
