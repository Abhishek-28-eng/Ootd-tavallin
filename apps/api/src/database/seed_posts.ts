import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { sequelize } from '../config/database';
import {
  User,
  UserProfile,
  OutfitPost,
  OutfitMedia,
  Tag,
  OutfitTag,
  ProductReference,
  StyleCategoryModel,
} from './models';

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateFashionImage(
  title: string,
  style: string,
  primaryColor: string,
  secondaryColor: string,
  width = 1080,
  height = 1440,
): Promise<Buffer> {
  const safeTitle = escapeXml(title);
  const safeStyle = escapeXml(style.toUpperCase());
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${primaryColor};stop-opacity:1" />
        <stop offset="100%" style="stop-color:${secondaryColor};stop-opacity:1" />
      </linearGradient>
      <linearGradient id="overlay" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" style="stop-color:#000000;stop-opacity:0.75" />
        <stop offset="50%" style="stop-color:#000000;stop-opacity:0.1" />
        <stop offset="100%" style="stop-color:#000000;stop-opacity:0.3" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" />
    <!-- Architectural grid lines for high fashion feel -->
    <line x1="80" y1="0" x2="80" y2="${height}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <line x1="${width - 80}" y1="0" x2="${width - 80}" y2="${height}" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    <line x1="0" y1="120" x2="${width}" y2="120" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
    
    <!-- Central artistic fashion silhouettes / geometric forms -->
    <circle cx="${width / 2}" cy="${height / 2 - 80}" r="260" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
    <rect x="${width / 2 - 160}" y="${height / 2 - 240}" width="320" height="420" rx="24" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" stroke-width="2" />
    
    <rect width="100%" height="100%" fill="url(#overlay)" />

    <!-- Badges & Typography -->
    <text x="100" y="100" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="6">TAVALLIN EDITORIAL</text>
    <text x="100" y="${height - 240}" font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="600" fill="#E2E8F0" letter-spacing="4">OOTD // ${safeStyle}</text>
    <text x="100" y="${height - 180}" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="800" fill="#FFFFFF">${safeTitle}</text>
    <text x="100" y="${height - 120}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="400" fill="#CBD5E1" letter-spacing="1">Curated Daily Style • Seoul Inspiration</text>
  </svg>
  `;

  return sharp(Buffer.from(svg)).webp({ quality: 90 }).toBuffer();
}

async function seedPosts() {
  await sequelize.authenticate();
  console.log('Seeding demo fashion posts...');

  const user = await User.findOne({ where: { username: 'fashiontest' } });
  if (!user) {
    console.error('fashiontest user not found');
    process.exit(1);
  }

  const postsData = [
    {
      title: 'Monochrome Oversized Blazer & Wide-Leg Trousers',
      caption: 'Quiet luxury silhouette inspired by Seongsu-dong cafe culture. Muted charcoal tones with structured shoulders and cream leather accessories. #seoulfashion #minimalist #koreanstreetwear',
      style: 'Minimalist',
      styles: ['Minimalist', 'Korean Streetwear'],
      occasions: ['Everyday Casual', 'Work / Office', 'Brunch'],
      tags: ['minimalist', 'oversized_blazer', 'wide_leg', 'seoul_ootd', 'monochrome'],
      budgetMin: '4500.00',
      budgetMax: '9500.00',
      primaryColor: '#1A1A24',
      secondaryColor: '#3B3A4A',
      likesCount: 142,
      clothingDetails: 'Top: Oversized structured blazer in wool blend. Bottoms: Pleated high-waist charcoal trousers. Shoes: Chunky platform loafers.',
      products: [
        { productName: 'Wool-Blend Oversized Blazer', brand: 'Studio Tomboy', price: '6200', productUrl: 'https://example.com/blazer' },
        { productName: 'Wide Pleated Trousers', brand: 'Andersson Bell', price: '3800', productUrl: 'https://example.com/trousers' },
      ],
    },
    {
      title: 'Soft Layered Cardigan & Raw Denim',
      caption: 'Sunday stroll in Hannam-dong. Fluffy mohair cardigan over a ribbed knit tank paired with vintage wash relaxed jeans. #casualchic #autumnfit #koreanstyle',
      style: 'Korean Streetwear',
      styles: ['Korean Streetwear', 'Smart Casual'],
      occasions: ['Weekend', 'Date Night', 'Coffee Run'],
      tags: ['koreanstreetwear', 'cardigan', 'relaxed_denim', 'hannamdong', 'autumn_vibes'],
      budgetMin: '3200.00',
      budgetMax: '6800.00',
      primaryColor: '#2B2620',
      secondaryColor: '#8C7355',
      likesCount: 98,
      clothingDetails: 'Knit: Mohair drop-shoulder cardigan in oatmeal. Jeans: Selvedge straight-leg in vintage indigo.',
      products: [
        { productName: 'Oatmeal Mohair Cardigan', brand: 'Matin Kim', price: '4500', productUrl: 'https://example.com/cardigan' },
        { productName: 'Vintage Wash Denim', brand: 'Low Classic', price: '5200', productUrl: 'https://example.com/denim' },
      ],
    },
    {
      title: 'Techwear Utility Windbreaker & Cargo Fit',
      caption: 'Hongdae night energy. Weather-resistant nylon shell with articulated utility trousers and trail runner sneakers. #techwear #streetstyle #seoulnight',
      style: 'Streetwear',
      styles: ['Streetwear', 'Korean Streetwear'],
      occasions: ['Night Out', 'Concert / Festival', 'Casual'],
      tags: ['streetwear', 'utility', 'techwear', 'hongdae', 'gorpcore'],
      budgetMin: '5000.00',
      budgetMax: '12000.00',
      primaryColor: '#0F172A',
      secondaryColor: '#1E293B',
      likesCount: 231,
      clothingDetails: 'Outerwear: Matte black ripstop storm jacket. Pants: Multi-pocket tactical cargo. Footwear: Salomon XT-6.',
      products: [
        { productName: 'Ripstop Utility Jacket', brand: 'ADER Error', price: '8900', productUrl: 'https://example.com/jacket' },
        { productName: 'Modular Cargo Pants', brand: 'Thisisneverthat', price: '4800', productUrl: 'https://example.com/cargos' },
      ],
    },
    {
      title: 'Earthy Linen Trench & Tonal Slip Dress',
      caption: 'Effortless transitional spring/summer styling. Fluid drape linen coat layered over champagne silk slip. Warm golden hour light in Garosu-gil. #chic #romantic #garosugil',
      style: 'Romantic',
      styles: ['Romantic', 'Smart Casual'],
      occasions: ['Dinner', 'Art Gallery', 'Special Occasion'],
      tags: ['romantic', 'linen_coat', 'slip_dress', 'garosugil', 'aesthetic'],
      budgetMin: '6000.00',
      budgetMax: '15000.00',
      primaryColor: '#3F2E24',
      secondaryColor: '#A88B77',
      likesCount: 187,
      clothingDetails: 'Outerwear: Relaxed double-breasted linen coat. Dress: Bias-cut midi slip dress. Jewelry: Delicate organic silver earrings.',
      products: [
        { productName: 'Unstructured Linen Trench', brand: 'Recto', price: '9800', productUrl: 'https://example.com/trench' },
        { productName: 'Silk Midi Slip', brand: 'Arch The', price: '6400', productUrl: 'https://example.com/slip' },
      ],
    },
  ];

  const uploadsDir = join(process.cwd(), 'uploads', 'outfits', user.id);
  await mkdir(uploadsDir, { recursive: true });

  for (const p of postsData) {
    const post = await OutfitPost.create({
      userId: user.id,
      caption: p.caption,
      styleCategories: JSON.stringify(p.styles),
      occasions: JSON.stringify(p.occasions),
      budgetMin: p.budgetMin,
      budgetMax: p.budgetMax,
      currency: 'INR',
      clothingDetails: p.clothingDetails,
      status: 'published',
      likesCount: p.likesCount,
      commentsCount: 0,
      savesCount: Math.floor(p.likesCount / 4),
      publishedAt: new Date(),
    });

    // Generate main image and thumbnail
    const fileId = randomUUID();
    const mainBuf = await generateFashionImage(p.title, p.style, p.primaryColor, p.secondaryColor, 1080, 1440);
    const thumbBuf = await sharp(mainBuf).resize({ width: 400 }).webp({ quality: 80 }).toBuffer();

    const mainKey = `outfits/${user.id}/${fileId}.webp`;
    const thumbKey = `outfits/${user.id}/thumb_${fileId}.webp`;

    await sharp(mainBuf).toFile(join(process.cwd(), 'uploads', mainKey));
    await sharp(thumbBuf).toFile(join(process.cwd(), 'uploads', thumbKey));

    await OutfitMedia.create({
      outfitPostId: post.id,
      userId: user.id,
      objectKey: mainKey,
      publicUrl: `http://localhost:3000/uploads/${mainKey}`,
      thumbnailUrl: `http://localhost:3000/uploads/${thumbKey}`,
      mimeType: 'image/webp',
      fileSize: mainBuf.length,
      width: 1080,
      height: 1440,
      orderIndex: 0,
      isProcessed: true,
    });

    // Tags
    for (const tagSlug of p.tags) {
      const [tag] = await Tag.findOrCreate({
        where: { slug: tagSlug },
        defaults: { name: tagSlug.replace(/_/g, ' '), slug: tagSlug },
      });
      await OutfitTag.findOrCreate({
        where: { outfitPostId: post.id, tagId: tag.id },
        defaults: { outfitPostId: post.id, tagId: tag.id },
      });
      await Tag.increment({ postsCount: 1 }, { where: { id: tag.id } });
    }

    // Products
    if (p.products?.length) {
      await ProductReference.bulkCreate(
        p.products.map((prod) => ({
          outfitPostId: post.id,
          productName: prod.productName,
          brand: prod.brand,
          price: prod.price,
          currency: 'INR',
          productUrl: prod.productUrl,
          imageUrl: null,
          isAffiliate: false,
        })),
      );
    }

    await UserProfile.increment({ postsCount: 1 }, { where: { userId: user.id } });
    console.log(`Created post: ${p.title} (${post.id})`);
  }

  console.log('Seeding completed successfully!');
  process.exit(0);
}

seedPosts().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
