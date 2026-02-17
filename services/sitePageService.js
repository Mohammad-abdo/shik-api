const { prisma } = require('../lib/prisma');

const SLUGS = ['about', 'app', 'policy', 'privacy'];

async function ensurePagesExist() {
  for (const slug of SLUGS) {
    await prisma.sitePage.upsert({
      where: { slug },
      create: {
        slug,
        title: slug.charAt(0).toUpperCase() + slug.slice(1),
        titleAr: null,
        body: '',
        bodyAr: null,
      },
      update: {},
    });
  }
}

async function getAll() {
  await ensurePagesExist();
  return prisma.sitePage.findMany({
    orderBy: { slug: 'asc' },
  });
}

async function getBySlug(slug) {
  let page = await prisma.sitePage.findUnique({
    where: { slug },
  });
  if (!page && SLUGS.includes(slug)) {
    await ensurePagesExist();
    page = await prisma.sitePage.findUnique({
      where: { slug },
    });
  }
  return page;
}

async function updateBySlug(slug, dto) {
  if (!SLUGS.includes(slug)) {
    throw Object.assign(new Error('Invalid page slug'), { statusCode: 400 });
  }
  await ensurePagesExist();
  return prisma.sitePage.update({
    where: { slug },
    data: {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
      ...(dto.body !== undefined && { body: dto.body }),
      ...(dto.bodyAr !== undefined && { bodyAr: dto.bodyAr }),
    },
  });
}

module.exports = { getAll, getBySlug, updateBySlug, SLUGS };
