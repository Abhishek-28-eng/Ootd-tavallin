// ============================================================
// Seed 20 Diverse Dummy Fashion Curators with Photos & Brands
// Run via: npx tsx src/database/seed_dummy_users.ts
// ============================================================

import argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { sequelize } from '../config/database';
import {
  User,
  UserProfile,
  UserPreference,
  OutfitPost,
  OutfitMedia,
  ProductReference,
  Tag,
  OutfitTag,
  Follow,
  setupAssociations,
} from './models';

interface DummyUserData {
  username: string;
  displayName: string;
  email: string;
  location: string;
  avatarUrl: string;
  bio: string;
  styles: string[];
  brands: string[];
  posts: Array<{
    title: string;
    caption: string;
    imageUrl: string;
    styles: string[];
    occasions: string[];
    tags: string[];
    likesCount: number;
    clothingDetails: string;
    products: Array<{
      productName: string;
      brand: string;
      price: string;
      productUrl: string;
    }>;
  }>;
}

const DUMMY_USERS: DummyUserData[] = [
  {
    username: 'elena_vogue',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@tavallin.dev',
    location: 'Paris, France',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    bio: 'Editorial stylist & fashion director. Fashion week regular obsessed with tailored wool coats and vintage silhouettes.',
    styles: ['minimalist', 'formal', 'dark_academia'],
    brands: ['Zara', 'COS', 'Jacquemus', 'Maison Margiela', 'Acne Studios'],
    posts: [
      {
        title: 'Structured Camel Overcoat & Tailored Trousers',
        caption: 'Late autumn morning in Le Marais. Layered pure wool with cream knitwear and structured leather. #parisfashion #quietluxury #minimalist',
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1080&auto=format&fit=crop&q=80',
        styles: ['minimalist', 'formal'],
        occasions: ['everyday', 'work', 'brunch'],
        tags: ['quietluxury', 'camelcoat', 'parisian', 'minimalist', 'workwear'],
        likesCount: 342,
        clothingDetails: 'Top: Wool blend double-breasted coat. Knit: Off-white ribbed turtleneck. Bottom: Pleated wide trousers.',
        products: [
          { productName: 'Wool-Blend Tailored Coat', brand: 'COS', price: '16500', productUrl: 'https://www.cos.com' },
          { productName: 'Ribbed Knit Turtleneck', brand: 'Zara', price: '3490', productUrl: 'https://www.zara.com' },
          { productName: 'Le Chiquito Leather Bag', brand: 'Jacquemus', price: '48000', productUrl: 'https://www.jacquemus.com' },
        ],
      },
    ],
  },
  {
    username: 'marcus_kicks',
    displayName: 'Marcus Chen',
    email: 'marcus.chen@tavallin.dev',
    location: 'Tokyo, Japan',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    bio: 'Harajuku street culture archivalist. Chunky sneakers, boxy silhouettes, and technical outerwear.',
    styles: ['streetwear', 'korean_streetwear', 'grunge'],
    brands: ['Nike', 'Stussy', 'Uniqlo', 'Andersson Bell', 'Salomon'],
    posts: [
      {
        title: 'Technical Cargo & Pigment Dye Graphic Hood',
        caption: 'Subway rides across Shibuya. Vintage washed hoodie paired with multi-pocket technical trousers. #tokyofashion #streetwear #sneakers',
        imageUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=1080&auto=format&fit=crop&q=80',
        styles: ['streetwear', 'korean_streetwear'],
        occasions: ['everyday', 'night_out', 'travel'],
        tags: ['tokyostreet', 'cargo', 'streetwear', 'nike', 'hoodie'],
        likesCount: 428,
        clothingDetails: 'Top: Boxy pigment dyed heavy hoodie. Bottom: Ripstop wide cargo trousers. Footwear: Retro trainers.',
        products: [
          { productName: 'Pigment Dyed Heavy Hoodie', brand: 'Stussy', price: '11500', productUrl: 'https://www.stussy.com' },
          { productName: 'Wide-Fit Parachute Cargo Trousers', brand: 'Uniqlo', price: '3990', productUrl: 'https://www.uniqlo.com' },
          { productName: 'Air Max 95 Retro', brand: 'Nike', price: '14995', productUrl: 'https://www.nike.com' },
        ],
      },
    ],
  },
  {
    username: 'chloe_couture',
    displayName: 'Chloe Dubois',
    email: 'chloe.dubois@tavallin.dev',
    location: 'Milan, Italy',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=80',
    bio: 'Fashion journalist & visual storyteller. Monochrome palettes, architectural silhouettes, and Italian leather.',
    styles: ['minimalist', 'formal', 'romantic'],
    brands: ['Prada', 'Mango', 'Zara', 'Lemaire', 'COS'],
    posts: [
      {
        title: 'Satin Pleated Midi & Sculptural Mock Neck',
        caption: 'Milanese afternoon espresso. Fluid champagne satin balanced by crisp tailored lines. #milanostyle #parisianchic #editorial',
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080&auto=format&fit=crop&q=80',
        styles: ['minimalist', 'romantic'],
        occasions: ['work', 'date_night', 'brunch'],
        tags: ['milanfashion', 'satinmidi', 'chic', 'mango', 'elegant'],
        likesCount: 289,
        clothingDetails: 'Top: Compact mock neck top. Bottom: Sunray pleated satin skirt. Shoes: Pointed leather kitten heels.',
        products: [
          { productName: 'Pleated Satin Midi Skirt', brand: 'Mango', price: '4590', productUrl: 'https://shop.mango.com' },
          { productName: 'Mock-Neck Fine Knit Top', brand: 'Zara', price: '2990', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'arjun_minimal',
    displayName: 'Arjun Mehta',
    email: 'arjun.mehta@tavallin.dev',
    location: 'Mumbai, India',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    bio: 'Ecru linens, calm neutrals, and handloom textures for humid Bombay days. Minimalist essentials curator.',
    styles: ['minimalist', 'smart_casual', 'ethnic_traditional'],
    brands: ['FabIndia', 'Zara', 'Uniqlo', 'Massimo Dutti', 'Nicobar'],
    posts: [
      {
        title: 'Ecru Linen Short Kurta & Pleated Trousers',
        caption: 'Kala Ghoda cafe hopping. Breathable handwoven linen with tailored pleats. #mumbaifashion #linen #minimalistindia',
        imageUrl: 'https://images.unsplash.com/photo-1508427953056-b00b8d78ebf5?w=1080&auto=format&fit=crop&q=80',
        styles: ['minimalist', 'ethnic_traditional'],
        occasions: ['everyday', 'brunch', 'college'],
        tags: ['linen', 'fabindia', 'bombaystyle', 'ecru', 'handloom'],
        likesCount: 310,
        clothingDetails: 'Top: Pure linen mandarin collar short kurta. Bottom: Relaxed pleated cotton chinos.',
        products: [
          { productName: 'Pure Linen Mandarin Short Kurta', brand: 'FabIndia', price: '2790', productUrl: 'https://www.fabindia.com' },
          { productName: 'Relaxed Ankle Chinos', brand: 'Uniqlo', price: '3490', productUrl: 'https://www.uniqlo.com' },
        ],
      },
    ],
  },
  {
    username: 'zara_layers',
    displayName: 'Zara Al-Mansoor',
    email: 'zara.almansoor@tavallin.dev',
    location: 'Dubai, UAE',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&auto=format&fit=crop&q=80',
    bio: 'Contemporary luxury modest fashion. Architectural trench coats, tonal silk wraps, and statement footwear.',
    styles: ['festive', 'formal', 'minimalist'],
    brands: ['Massimo Dutti', 'Zara', 'Mango', 'Dior', 'H&M'],
    posts: [
      {
        title: 'Tonal Sand Draped Trench & Wide Slacks',
        caption: 'Sunset at DIFC. Fluid drape with structured shoulder pads in monochromatic warm sand. #dubaimodest #quietluxury #dubaifashion',
        imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=1080&auto=format&fit=crop&q=80',
        styles: ['formal', 'minimalist'],
        occasions: ['formal_event', 'work', 'night_out'],
        tags: ['dubaistyle', 'trenchcoat', 'massimodutti', 'sandtones'],
        likesCount: 375,
        clothingDetails: 'Outerwear: Fluid water-repellent trench coat. Bottom: Flared high-waist slacks.',
        products: [
          { productName: 'Flowing Lyocell Trench Coat', brand: 'Massimo Dutti', price: '14990', productUrl: 'https://www.massimodutti.com' },
          { productName: 'High-Waist Tailored Slacks', brand: 'Zara', price: '4290', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'kai_streetwear',
    displayName: 'Kai Takahashi',
    email: 'kai.takahashi@tavallin.dev',
    location: 'Seoul, South Korea',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
    bio: 'Hongdae street vibes & Seongsu fashion district. Oversized raw denim, boxy cardigans, and silver hardware.',
    styles: ['korean_streetwear', 'y2k', 'streetwear'],
    brands: ['Andersson Bell', 'Ader Error', 'Zara', 'Nike', 'H&M'],
    posts: [
      {
        title: 'Raw Edge Distressed Knit & Baggy Denim',
        caption: 'Seongsu cafe run. Chunky mohair blend knit with skater fit vintage wash jeans. #seoulstreetwear #kfashion #hongdae',
        imageUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1080&auto=format&fit=crop&q=80',
        styles: ['korean_streetwear', 'streetwear'],
        occasions: ['everyday', 'college', 'night_out'],
        tags: ['kfashion', 'seoul', 'baggydenim', 'knitwear', 'streetstyle'],
        likesCount: 512,
        clothingDetails: 'Top: Fuzzy textured oversized sweater. Bottom: Wide-leg skater jeans with raw hems.',
        products: [
          { productName: 'Fuzzy Textured Knit Sweater', brand: 'H&M', price: '3999', productUrl: 'https://www2.hm.com' },
          { productName: 'Skater Baggy Fit Denim', brand: 'Zara', price: '4590', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'sophia_atelier',
    displayName: 'Sophia Lindqvist',
    email: 'sophia.atelier@tavallin.dev',
    location: 'Stockholm, Sweden',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    bio: 'Scandinavian capsule closet designer. Less is always more. Monochromatic wool, cotton poplin, and clean lines.',
    styles: ['minimalist', 'casual', 'dark_academia'],
    brands: ['COS', 'Uniqlo', 'Acne Studios', 'Toteme', 'H&M'],
    posts: [
      {
        title: 'Heavyweight Wool Crew & Clean Ecru Trousers',
        caption: 'Gamla Stan crisp morning. Sustainable wool knitwear with minimalist tailored bottoms. #scandistyle #capsulecloset #minimalism',
        imageUrl: 'https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?w=1080&auto=format&fit=crop&q=80',
        styles: ['minimalist', 'casual'],
        occasions: ['everyday', 'work', 'brunch'],
        tags: ['scandiminimalism', 'woolcrew', 'cos', 'stockholm', 'capsule'],
        likesCount: 295,
        clothingDetails: 'Top: Chunky boiled wool crewneck. Bottom: Relaxed ecru denim trousers.',
        products: [
          { productName: 'Boiled Wool Crewneck Jumper', brand: 'COS', price: '8900', productUrl: 'https://www.cos.com' },
          { productName: 'Straight High Jeans', brand: 'H&M', price: '2499', productUrl: 'https://www2.hm.com' },
        ],
      },
    ],
  },
  {
    username: 'rohan_dapper',
    displayName: 'Rohan Kapoor',
    email: 'rohan.kapoor@tavallin.dev',
    location: 'New Delhi, India',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80',
    bio: 'Tailored menswear with traditional Indian craftsmanship. Modern bandhgalas, tuxedos, and bespoke shirting.',
    styles: ['formal', 'smart_casual', 'ethnic_traditional'],
    brands: ['Van Heusen', 'Peter England', 'FabIndia', 'Allen Solly', 'Raymond'],
    posts: [
      {
        title: 'Midnight Navy Structured Bandhgala Jacket',
        caption: 'Delhi winter cocktail evening. Rich navy wool bandhgala with metallic engraved buttons. #dapper #bandhgala #delhistyle',
        imageUrl: 'https://images.unsplash.com/photo-1509551388413-e18d0ac5d495?w=1080&auto=format&fit=crop&q=80',
        styles: ['formal', 'ethnic_traditional'],
        occasions: ['wedding', 'formal_event', 'party'],
        tags: ['bandhgala', 'menswear', 'tailored', 'weddinglook', 'raymond'],
        likesCount: 460,
        clothingDetails: 'Jacket: Structured midnight navy bandhgala. Trousers: Slim fit wool trousers.',
        products: [
          { productName: 'Structured Bandhgala Suit', brand: 'Van Heusen', price: '12999', productUrl: 'https://www.vanheusenindia.com' },
          { productName: 'Slim Fit Formal Trousers', brand: 'Peter England', price: '2499', productUrl: 'https://www.peterengland.com' },
        ],
      },
    ],
  },
  {
    username: 'mia_aesthetic',
    displayName: 'Mia Thorne',
    email: 'mia.thorne@tavallin.dev',
    location: 'London, UK',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=500&auto=format&fit=crop&q=80',
    bio: 'Shoreditch thrift hunter & 90s nostalgia stylist. Leather moto jackets, platform docs, and vintage denim.',
    styles: ['vintage', 'grunge', 'eclectic'],
    brands: ['Levis', 'Zara', 'Mango', 'Urban Outfitters', 'H&M'],
    posts: [
      {
        title: 'Vintage Leather Moto & Distressed Levi 501s',
        caption: 'Brick Lane Sunday market stroll. Distressed genuine leather paired with vintage washed denim. #vintagefashion #londonstreet #thrifted',
        imageUrl: 'https://images.unsplash.com/photo-1534126511673-b6899657816a?w=1080&auto=format&fit=crop&q=80',
        styles: ['vintage', 'grunge'],
        occasions: ['everyday', 'night_out', 'party'],
        tags: ['vintage', 'levis', 'motojacket', 'grunge', '90sfashion'],
        likesCount: 388,
        clothingDetails: 'Jacket: Oversized distressed moto jacket. Bottom: Vintage wash Levi 501s.',
        products: [
          { productName: '501 Original Fit Jeans', brand: 'Levis', price: '4999', productUrl: 'https://www.levi.in' },
          { productName: 'Faux Leather Biker Jacket', brand: 'Zara', price: '6990', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'leo_vintage',
    displayName: 'Leo Rossi',
    email: 'leo.rossi@tavallin.dev',
    location: 'Florence, Italy',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=500&auto=format&fit=crop&q=80',
    bio: 'Pitti Uomo enthusiast. Italian sprezzatura, unstructured blazers, earthy linens, and chocolate suede loafers.',
    styles: ['smart_casual', 'preppy', 'vintage'],
    brands: ['Massimo Dutti', 'Zara', 'Boggi Milano', 'H&M', 'Loro Piana'],
    posts: [
      {
        title: 'Unstructured Olive Linen Blazer & Suede Loafers',
        caption: 'Piazza della Signoria golden hour. Effortless Tuscan tailoring with roll-up cuffs. #sprezzatura #mensstyle #florence',
        imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=1080&auto=format&fit=crop&q=80',
        styles: ['smart_casual', 'preppy'],
        occasions: ['brunch', 'work', 'date_night'],
        tags: ['sprezzatura', 'linenblazer', 'florence', 'massimodutti', 'menswear'],
        likesCount: 415,
        clothingDetails: 'Jacket: Unstructured garment-dyed olive linen blazer. Shirt: Striped poplin shirt.',
        products: [
          { productName: '100% Linen Slim Fit Blazer', brand: 'Massimo Dutti', price: '12990', productUrl: 'https://www.massimodutti.com' },
          { productName: 'Slim Striped Poplin Shirt', brand: 'Zara', price: '3290', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'ananya_chic',
    displayName: 'Ananya Sharma',
    email: 'ananya.sharma@tavallin.dev',
    location: 'Bangalore, India',
    avatarUrl: 'https://images.unsplash.com/photo-1534751516642-a171edd25216?w=500&auto=format&fit=crop&q=80',
    bio: 'Contemporary fusion ethnic wear. Chikankari with denim, block prints, and bohemian oxidized silver jewellery.',
    styles: ['ethnic_traditional', 'festive', 'bohemian'],
    brands: ['Biba', 'W for Woman', 'Global Desi', 'FabIndia', 'Myntra Fashion'],
    posts: [
      {
        title: 'Lilac Chikankari Anarkali with Flared Hem',
        caption: 'Diwali festive season preview. Intricate Lucknowi Chikankari embroidery on breezy mulmul cotton. #ethnicwear #chikankari #festivefit',
        imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=1080&auto=format&fit=crop&q=80',
        styles: ['ethnic_traditional', 'festive'],
        occasions: ['festive_puja', 'wedding', 'party'],
        tags: ['chikankari', 'biba', 'festive', 'anarkali', 'indianwear'],
        likesCount: 520,
        clothingDetails: 'Top: Hand-embroidered Chikankari Anarkali kurta. Bottom: Matching churidar pants with organza dupatta.',
        products: [
          { productName: 'Chikankari Hand-Embroidered Anarkali', brand: 'Biba', price: '4999', productUrl: 'https://www.biba.in' },
          { productName: 'Gold Foil Printed Dupatta', brand: 'W for Woman', price: '1499', productUrl: 'https://www.wforwoman.com' },
        ],
      },
    ],
  },
  {
    username: 'david_tailored',
    displayName: 'David Sterling',
    email: 'david.sterling@tavallin.dev',
    location: 'New York, USA',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=500&auto=format&fit=crop&q=80',
    bio: 'Manhattan tailoring & smart city attire. Precision lapels, cashmere turtlenecks, and monk strap leather shoes.',
    styles: ['formal', 'business_casual', 'minimalist'],
    brands: ['Ralph Lauren', 'Van Heusen', 'Zara', 'Allen Solly', 'COS'],
    posts: [
      {
        title: 'Double-Breasted Pinstripe Suit & Crisp Oxford',
        caption: 'Fifth Avenue mornings. Timeless navy pinstripes with modern relaxed tailoring. #menswear #tailored #newyorkfashion',
        imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?w=1080&auto=format&fit=crop&q=80',
        styles: ['formal', 'business_casual'],
        occasions: ['work', 'formal_event', 'night_out'],
        tags: ['pinstripe', 'suitup', 'mensfashion', 'ralphlauren', 'nycfits'],
        likesCount: 390,
        clothingDetails: 'Suit: Italian wool double-breasted 6-button suit. Shirt: Egyptian cotton spread collar shirt.',
        products: [
          { productName: 'Tailored Pinstripe Wool Suit', brand: 'Van Heusen', price: '15999', productUrl: 'https://www.vanheusenindia.com' },
          { productName: 'Oxford Cotton Shirt', brand: 'Allen Solly', price: '2499', productUrl: 'https://www.allensolly.com' },
        ],
      },
    ],
  },
  {
    username: 'hannah_y2k',
    displayName: 'Hannah Miller',
    email: 'hannah.miller@tavallin.dev',
    location: 'Los Angeles, USA',
    avatarUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&auto=format&fit=crop&q=80',
    bio: '2000s nostalgic revivalist. Baby tees, low-slung parachute trousers, glitter gloss, and silver baguette bags.',
    styles: ['y2k', 'streetwear', 'eclectic'],
    brands: ['ONLY', 'Forever 21', 'H&M', 'Zara', 'Urban Outfitters'],
    posts: [
      {
        title: 'Rhinestone Baby Tee & Cargo Parachute Pants',
        caption: 'Silver Lake coffee walk. Early 2000s MTV vibes with parachute nylon and chunky skate sneakers. #y2k #y2kfashion #lafit',
        imageUrl: 'https://images.unsplash.com/photo-1550614000-4895a10e1bfd?w=1080&auto=format&fit=crop&q=80',
        styles: ['y2k', 'streetwear'],
        occasions: ['everyday', 'college', 'party'],
        tags: ['y2k', 'babytee', 'parachutepants', 'only', 'nostalgia'],
        likesCount: 445,
        clothingDetails: 'Top: Baby ribbed graphic tee. Bottom: Low-waist toggle parachute cargo pants.',
        products: [
          { productName: 'Cropped Baby Graphic Tee', brand: 'ONLY', price: '1499', productUrl: 'https://www.only.in' },
          { productName: 'Nylon Parachute Cargo Pants', brand: 'H&M', price: '2999', productUrl: 'https://www2.hm.com' },
        ],
      },
    ],
  },
  {
    username: 'tariq_urban',
    displayName: 'Tariq Al-Fassi',
    email: 'tariq.alfassi@tavallin.dev',
    location: 'Berlin, Germany',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&auto=format&fit=crop&q=80',
    bio: 'Techwear minimalist. Modular utility apparel, waterproof Gore-Tex parkas, and dark monochrome urban silhouettes.',
    styles: ['streetwear', 'athleisure', 'minimalist'],
    brands: ['Nike', 'Uniqlo', 'Salomon', 'Zara', 'The North Face'],
    posts: [
      {
        title: 'All-Weather Modular Shell & Tapered Cargos',
        caption: 'Kreuzberg rainy evening. Fully seam-sealed technical jacket paired with stretch utility pants. #berlinstyle #techwear #allblack',
        imageUrl: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=1080&auto=format&fit=crop&q=80',
        styles: ['streetwear', 'athleisure'],
        occasions: ['everyday', 'outdoor', 'travel'],
        tags: ['techwear', 'berlin', 'allblack', 'nike', 'utility'],
        likesCount: 360,
        clothingDetails: 'Jacket: 3-layer technical waterproof shell jacket. Bottom: Tactical multi-pocket jogger.',
        products: [
          { productName: 'ACG Storm-FIT Shell Parka', brand: 'Nike', price: '16995', productUrl: 'https://www.nike.com' },
          { productName: 'Ultra Stretch Utility Joggers', brand: 'Uniqlo', price: '2990', productUrl: 'https://www.uniqlo.com' },
        ],
      },
    ],
  },
  {
    username: 'camille_parisian',
    displayName: 'Camille Laurent',
    email: 'camille.laurent@tavallin.dev',
    location: 'Paris, France',
    avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=500&auto=format&fit=crop&q=80',
    bio: 'Effortless French girl formulas. Breton striped knits, relaxed straight denim, wicker totes, and red lips.',
    styles: ['casual', 'minimalist', 'preppy'],
    brands: ['Mango', 'Zara', 'Levis', 'Uniqlo', 'H&M'],
    posts: [
      {
        title: 'Breton Stripe Knit & Levi High-Straight Denim',
        caption: 'Sunday boulangerie stroll by the Seine. Timeless navy stripes with vintage wash straight jeans. #parisianstyle #effortless #frenchgirl',
        imageUrl: 'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=1080&auto=format&fit=crop&q=80',
        styles: ['casual', 'minimalist'],
        occasions: ['everyday', 'brunch', 'travel'],
        tags: ['parisian', 'breton', 'levis501', 'mango', 'frenchstyle'],
        likesCount: 495,
        clothingDetails: 'Top: Heavyweight cotton navy Breton striped knit. Bottom: High-rise straight leg vintage denim.',
        products: [
          { productName: 'Striped Cotton Knit Sweater', brand: 'Mango', price: '3490', productUrl: 'https://shop.mango.com' },
          { productName: 'Ribcage Straight Ankle Jeans', brand: 'Levis', price: '4299', productUrl: 'https://www.levi.in' },
        ],
      },
    ],
  },
  {
    username: 'vikram_heritage',
    displayName: 'Vikramaditya Roy',
    email: 'vikram.roy@tavallin.dev',
    location: 'Kolkata, India',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=500&auto=format&fit=crop&q=80',
    bio: 'Royal Bengal heritage styling. Handwoven tussar silk kurtas, structured Nehru jackets, and silver pocket watches.',
    styles: ['ethnic_traditional', 'festive', 'vintage'],
    brands: ['FabIndia', 'Biba', 'Raymond', 'Manyavar', 'W for Woman'],
    posts: [
      {
        title: 'Raw Silk Nehru Jacket over Tussar Kurta',
        caption: 'Durga Puja Ashtami look. Handspun tussar silk in warm turmeric with antique brass buttons. #kolkatafashion #heritage #handloom',
        imageUrl: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?w=1080&auto=format&fit=crop&q=80',
        styles: ['ethnic_traditional', 'festive'],
        occasions: ['festive_puja', 'wedding', 'formal_event'],
        tags: ['nehrujacket', 'tussarsilk', 'fabindia', 'bengalheritage', 'ethnic'],
        likesCount: 580,
        clothingDetails: 'Jacket: Raw silk structured sleeveless Nehru jacket. Kurta: Natural dyed handloom tussar kurta.',
        products: [
          { productName: 'Raw Silk Mandarin Nehru Jacket', brand: 'FabIndia', price: '4990', productUrl: 'https://www.fabindia.com' },
          { productName: 'Fine Tussar Silk Kurta', brand: 'Raymond', price: '3999', productUrl: 'https://www.raymond.in' },
        ],
      },
    ],
  },
  {
    username: 'olivia_monochrome',
    displayName: 'Olivia Vance',
    email: 'olivia.vance@tavallin.dev',
    location: 'Toronto, Canada',
    avatarUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=80',
    bio: 'Strictly black, charcoal, and ecru. Architectural silhouettes and sculptured boots for modern minimalists.',
    styles: ['minimalist', 'dark_academia', 'androgynous'],
    brands: ['Zara', 'COS', 'Acne Studios', 'Mango', 'Uniqlo'],
    posts: [
      {
        title: 'Asymmetrical Draped Tunic & Cropped Trousers',
        caption: 'Art Gallery of Ontario gallery opening. High contrast geometry in heavy Italian poplin. #monochrome #minimalistfit #torontofashion',
        imageUrl: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=1080&auto=format&fit=crop&q=80',
        styles: ['minimalist', 'dark_academia'],
        occasions: ['work', 'date_night', 'formal_event'],
        tags: ['allblack', 'monochrome', 'cos', 'architectural', 'minimal'],
        likesCount: 335,
        clothingDetails: 'Top: Asymmetric draped mock-neck tunic. Bottom: Cropped pleat-front wool trousers.',
        products: [
          { productName: 'Draped Asymmetric Tunic', brand: 'COS', price: '7900', productUrl: 'https://www.cos.com' },
          { productName: 'Cropped Tailored Trousers', brand: 'Zara', price: '3990', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'jin_kstyle',
    displayName: 'Jin-Woo Park',
    email: 'jinwoo.park@tavallin.dev',
    location: 'Busan, South Korea',
    avatarUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=500&auto=format&fit=crop&q=80',
    bio: 'K-Pop idol stage and airport fashion curator. Fuzzy knit cardigans, silver ear cuffs, and relaxed tailored slacks.',
    styles: ['korean_streetwear', 'preppy', 'casual'],
    brands: ['Andersson Bell', 'Zara', 'H&M', 'Nike', 'Uniqlo'],
    posts: [
      {
        title: 'Oversized Fuzzy Argyle Cardigan & Relaxed Slacks',
        caption: 'Haeundae coastal afternoon. Soft texture contrasts with crisp wide trousers and platform loafers. #kpopfashion #airportfit #kstyle',
        imageUrl: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=1080&auto=format&fit=crop&q=80',
        styles: ['korean_streetwear', 'preppy'],
        occasions: ['everyday', 'college', 'brunch'],
        tags: ['cardigan', 'kfashion', 'kpopstyle', 'hm', 'oversized'],
        likesCount: 620,
        clothingDetails: 'Top: Chunky mohair argyle oversized cardigan. Bottom: Flowing grey wide slacks.',
        products: [
          { productName: 'Oversized Fuzzy Knit Cardigan', brand: 'H&M', price: '3499', productUrl: 'https://www2.hm.com' },
          { productName: 'Flowing Wide-Fit Slacks', brand: 'Zara', price: '3990', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'zoe_avantgarde',
    displayName: 'Zoe Katsaros',
    email: 'zoe.katsaros@tavallin.dev',
    location: 'Athens, Greece',
    avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80',
    bio: 'Deconstructed clothing as wearable art. Draped layers, asymmetric lapels, raw seams, and sculptural jewelry.',
    styles: ['eclectic', 'androgynous', 'grunge'],
    brands: ['Maison Margiela', 'COS', 'Zara', 'Mango', 'Acne Studios'],
    posts: [
      {
        title: 'Multi-Panel Deconstructed Trench & Chiseled Boots',
        caption: 'Contemporary art biennial tour. Contrast fabric blocking with distressed edge details. #avantgarde #deconstruction #runway',
        imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=1080&auto=format&fit=crop&q=80',
        styles: ['eclectic', 'androgynous'],
        occasions: ['night_out', 'party', 'formal_event'],
        tags: ['avantgarde', 'deconstructed', 'trench', 'fashionart', 'cos'],
        likesCount: 395,
        clothingDetails: 'Outerwear: Split-panel deconstructed trench coat. Footwear: Chiseled square-toe boots.',
        products: [
          { productName: 'Deconstructed Panel Trench Coat', brand: 'COS', price: '18500', productUrl: 'https://www.cos.com' },
          { productName: 'Square-Toe Leather Boots', brand: 'Zara', price: '7990', productUrl: 'https://www.zara.com' },
        ],
      },
    ],
  },
  {
    username: 'dev_classics',
    displayName: 'Dev Malhotra',
    email: 'dev.malhotra@tavallin.dev',
    location: 'Pune, India',
    avatarUrl: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?w=500&auto=format&fit=crop&q=80',
    bio: 'Smart casuals for everyday campus and coffee runs. Oxford button-downs, clean trainers, and tailored chinos.',
    styles: ['casual', 'smart_casual', 'preppy'],
    brands: ['Allen Solly', 'Roadster', 'Jack & Jones', 'Levis', 'Uniqlo'],
    posts: [
      {
        title: 'Sage Oxford Button-Down & Tapered Beige Chinos',
        caption: 'Koregaon Park work & coffee session. Crisp washed oxford cotton with comfortable stretch chinos. #punefashion #smartcasual #everydayfit',
        imageUrl: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=1080&auto=format&fit=crop&q=80',
        styles: ['casual', 'smart_casual'],
        occasions: ['college', 'everyday', 'work'],
        tags: ['oxfordshirt', 'smartcasual', 'allensolly', 'punestyle', 'chinos'],
        likesCount: 275,
        clothingDetails: 'Top: 100% cotton washed sage oxford shirt. Bottom: Tapered stretch twill beige chinos.',
        products: [
          { productName: 'Pure Cotton Oxford Shirt', brand: 'Allen Solly', price: '2199', productUrl: 'https://www.allensolly.com' },
          { productName: 'Slim Tapered Stretch Chinos', brand: 'Roadster', price: '1499', productUrl: 'https://www.myntra.com' },
        ],
      },
    ],
  },
];

async function seedDummyUsers() {
  await sequelize.authenticate();
  setupAssociations();

  console.log('--- Starting Seeder: 20 Dummy Fashion Users with Photos & Brands ---');

  const defaultPassword = 'Password123!';
  const passwordHash = await argon2.hash(defaultPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const createdUsers: User[] = [];

  for (const u of DUMMY_USERS) {
    // 1. Create or Find User
    let [user, created] = await User.findOrCreate({
      where: { username: u.username.toLowerCase() },
      defaults: {
        id: randomUUID(),
        email: u.email,
        username: u.username.toLowerCase(),
        passwordHash,
        role: 'user',
        isEmailVerified: true,
        isOnboarded: true,
        isPrivate: false,
        isSuspended: false,
      },
    });

    createdUsers.push(user);

    // 2. Create or Update UserProfile
    let profile = await UserProfile.findOne({ where: { userId: user.id } });
    if (!profile) {
      profile = await UserProfile.create({
        id: randomUUID(),
        userId: user.id,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        location: u.location,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
      });
    } else {
      await profile.update({
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        bio: u.bio,
        location: u.location,
      });
    }

    // 3. Create or Update UserPreference with style categories & brands
    let [prefs] = await UserPreference.findOrCreate({
      where: { userId: user.id },
      defaults: {
        id: randomUUID(),
        userId: user.id,
        styleCategories: JSON.stringify(u.styles),
        brands: JSON.stringify(u.brands),
        currency: 'INR',
        city: u.location.split(',')[0]?.trim() ?? null,
        showBudgetOnProfile: false,
      },
    });

    await prefs.update({
      styleCategories: JSON.stringify(u.styles),
      brands: JSON.stringify(u.brands),
    });

    // 4. Create Outfit Posts for this user
    for (const postData of u.posts) {
      // Check if post with same caption already exists to prevent duplicates
      const existingPost = await OutfitPost.findOne({
        where: { userId: user.id, caption: postData.caption },
      });

      if (!existingPost) {
        const postId = randomUUID();
        const post = await OutfitPost.create({
          id: postId,
          userId: user.id,
          caption: postData.caption,
          styleCategories: JSON.stringify(postData.styles),
          occasions: JSON.stringify(postData.occasions),
          status: 'published',
          likesCount: postData.likesCount,
          commentsCount: Math.floor(postData.likesCount * 0.08),
          savesCount: Math.floor(postData.likesCount * 0.15),
          clothingDetails: postData.clothingDetails,
          currency: 'INR',
          publishedAt: new Date(),
        });

        // Add Media
        await OutfitMedia.create({
          id: randomUUID(),
          outfitPostId: post.id,
          userId: user.id,
          objectKey: `outfits/${user.id}/${randomUUID()}.webp`,
          publicUrl: postData.imageUrl,
          thumbnailUrl: postData.imageUrl,
          mimeType: 'image/webp',
          fileSize: 250000,
          width: 1080,
          height: 1440,
          orderIndex: 0,
          isProcessed: true,
        });

        // Add Product References (tagged brands)
        if (postData.products?.length) {
          await ProductReference.bulkCreate(
            postData.products.map((p) => ({
              id: randomUUID(),
              outfitPostId: post.id,
              productName: p.productName,
              brand: p.brand,
              price: p.price,
              currency: 'INR',
              productUrl: p.productUrl,
              imageUrl: null,
              isAffiliate: false,
            })),
          );
        }

        // Add Tags
        for (const tagSlug of postData.tags) {
          const [tag] = await Tag.findOrCreate({
            where: { slug: tagSlug },
            defaults: {
              id: randomUUID(),
              name: tagSlug.replace(/_/g, ' '),
              slug: tagSlug,
              postsCount: 0,
              isActive: true,
            },
          });

          await OutfitTag.findOrCreate({
            where: { outfitPostId: post.id, tagId: tag.id },
            defaults: { outfitPostId: post.id, tagId: tag.id },
          });

          await tag.increment('postsCount', { by: 1 });
        }

        await profile.increment('postsCount', { by: 1 });
      }
    }

    console.log(`[User] @${u.username} (${u.displayName}) seeded with ${u.brands.length} brands & lookbook post.`);
  }

  // 5. Create realistic mutual follows across dummy users
  console.log('\n--- Establishing Social Connections & Follow Graph ---');
  for (let i = 0; i < createdUsers.length; i++) {
    const userA = createdUsers[i];
    // Follow 3 to 6 other dummy users
    const numToFollow = 3 + (i % 4);
    for (let j = 1; j <= numToFollow; j++) {
      const targetIndex = (i + j) % createdUsers.length;
      const userB = createdUsers[targetIndex];
      if (userA && userB && userA.id !== userB.id) {
        const [, createdFollow] = await Follow.findOrCreate({
          where: { followerId: userA.id, followingId: userB.id },
          defaults: {
            id: randomUUID(),
            followerId: userA.id,
            followingId: userB.id,
          },
        });
        if (createdFollow) {
          await UserProfile.increment('followingCount', { by: 1, where: { userId: userA.id } });
          await UserProfile.increment('followersCount', { by: 1, where: { userId: userB.id } });
        }
      }
    }
  }

  console.log('\n✅ 20 Dummy Fashion Users with Photos, Brands, Outfits & Social Graph Seeded Successfully!');
  process.exit(0);
}

seedDummyUsers().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
