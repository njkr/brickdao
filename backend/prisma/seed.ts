import { PrismaClient, PropertyStatus, Role } from '@prisma/client';
import { parseAdminAddresses } from '../src/common/config/env.validation';

const prisma = new PrismaClient();

/** Ported from BrickFi's src/utils/mockData.ts so Browse/Home show the same six listings. */
const properties = [
  {
    title: 'Luxury Downtown Apartment',
    description:
      'A stunning luxury apartment in the heart of the city. This property features floor-to-ceiling windows, premium finishes, and access to exclusive amenities including a rooftop pool, fitness center, and 24/7 concierge service.',
    imageUrl:
      'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    location: 'New York, NY',
    price: 450000,
    tokenPrice: 0.5,
    totalTokens: 1000,
    tokensSold: 650,
    status: PropertyStatus.AVAILABLE,
    features: ['3 Bedrooms', '2 Bathrooms', '1,800 sq ft', 'Built in 2020', 'Doorman', 'Gym'],
    documents: [
      { name: 'Property Deed', url: '#' },
      { name: 'Financial Projections', url: '#' },
      { name: 'Inspection Report', url: '#' },
    ],
    returnRate: 8.2,
  },
  {
    title: 'Beachfront Villa',
    description:
      'Luxurious beachfront property with direct access to pristine white sand beaches. This villa offers panoramic ocean views, a private infinity pool, and meticulously landscaped gardens. The perfect investment for those seeking high rental yields in a premium vacation destination.',
    imageUrl:
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    location: 'Miami, FL',
    price: 1200000,
    tokenPrice: 1.2,
    totalTokens: 1000,
    tokensSold: 1000,
    status: PropertyStatus.SOLD_OUT,
    features: ['5 Bedrooms', '6 Bathrooms', '4,500 sq ft', 'Private Pool', 'Beach Access', 'Smart Home'],
    documents: [
      { name: 'Property Deed', url: '#' },
      { name: 'Financial Projections', url: '#' },
      { name: 'Inspection Report', url: '#' },
    ],
    returnRate: 10.5,
  },
  {
    title: 'Modern Office Building',
    description:
      'Prime commercial real estate in the central business district. This modern office building features state-of-the-art facilities, energy-efficient design, and is fully leased to AAA-rated corporate tenants on long-term contracts, providing stable and predictable income.',
    imageUrl:
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
    location: 'Chicago, IL',
    price: 3500000,
    tokenPrice: 3.5,
    totalTokens: 1000,
    tokensSold: 300,
    status: PropertyStatus.AVAILABLE,
    features: ['25,000 sq ft', '10 Floors', 'Parking Garage', 'LEED Certified', 'Conference Center', '24/7 Security'],
    documents: [
      { name: 'Property Deed', url: '#' },
      { name: 'Tenant Agreements', url: '#' },
      { name: 'Financial Projections', url: '#' },
    ],
    returnRate: 7.8,
  },
  {
    title: 'Mountain Retreat',
    description:
      'Secluded luxury cabin nestled in the mountains with breathtaking views. This property combines rustic charm with modern amenities, featuring exposed wooden beams, a stone fireplace, and a private hot tub on the deck overlooking the valley.',
    imageUrl:
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?ixlib=rb-4.0.3&auto=format&fit=crop&w=1530&q=80',
    location: 'Aspen, CO',
    price: 875000,
    tokenPrice: 0.875,
    totalTokens: 1000,
    tokensSold: 0,
    status: PropertyStatus.COMING_SOON,
    features: ['4 Bedrooms', '3 Bathrooms', '2,800 sq ft', 'Hot Tub', 'Fireplace', '2-Car Garage'],
    documents: [
      { name: 'Property Deed', url: '#' },
      { name: 'Financial Projections', url: '#' },
      { name: 'Inspection Report', url: '#' },
    ],
    returnRate: 9.1,
  },
  {
    title: 'Urban Retail Space',
    description:
      'High-traffic retail location in a trendy urban neighborhood. This corner unit features large display windows, modern interior, and is surrounded by complementary businesses that drive consistent foot traffic throughout the week and weekend.',
    imageUrl:
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80',
    location: 'Austin, TX',
    price: 680000,
    tokenPrice: 0.68,
    totalTokens: 1000,
    tokensSold: 520,
    status: PropertyStatus.AVAILABLE,
    features: [
      '2,000 sq ft',
      'Corner Location',
      'High Foot Traffic',
      'Recently Renovated',
      'Storage Space',
      'Outdoor Seating',
    ],
    documents: [
      { name: 'Property Deed', url: '#' },
      { name: 'Market Analysis', url: '#' },
      { name: 'Financial Projections', url: '#' },
    ],
    returnRate: 8.7,
  },
  {
    title: 'Historic Brownstone',
    description:
      'Beautifully restored historic brownstone in a prestigious neighborhood. This property combines classic architectural details with modern updates, offering the perfect blend of character and convenience in one of the most sought-after locations.',
    imageUrl:
      'https://images.unsplash.com/photo-1448630360428-65456885c650?ixlib=rb-4.0.3&auto=format&fit=crop&w=1467&q=80',
    location: 'Boston, MA',
    price: 1850000,
    tokenPrice: 1.85,
    totalTokens: 1000,
    tokensSold: 780,
    status: PropertyStatus.AVAILABLE,
    features: ['4 Bedrooms', '3.5 Bathrooms', '3,200 sq ft', 'Original Hardwood Floors', 'Garden', 'Finished Basement'],
    documents: [
      { name: 'Property Deed', url: '#' },
      { name: 'Historic Designation', url: '#' },
      { name: 'Renovation Permits', url: '#' },
    ],
    returnRate: 6.9,
  },
];

async function main() {
  console.log('Seeding properties...');
  const contractAddress = process.env.ASSET_FACTORY_ADDRESS || undefined;
  for (const [index, property] of properties.entries()) {
    const existing = await prisma.property.findFirst({ where: { title: property.title } });
    if (existing) {
      console.log(`  skip (already exists): ${property.title}`);
      continue;
    }
    const { documents, ...data } = property;
    // Each property maps to one ERC-1155 token id (1..N) within the shared
    // AssetFactory contract — set ASSET_FACTORY_ADDRESS once it's deployed
    // (see contracts/README.md) so "Buy tokens" can place a real transaction.
    await prisma.property.create({
      data: { ...data, tokenId: index + 1, contractAddress, documents: { create: documents } },
    });
    console.log(`  created: ${property.title} (tokenId ${index + 1})`);
  }

  const adminAddresses = parseAdminAddresses(process.env.ADMIN_WALLET_ADDRESSES ?? '');
  for (const address of adminAddresses) {
    await prisma.user.upsert({
      where: { address },
      update: { role: Role.ADMIN },
      create: { address, role: Role.ADMIN },
    });
    console.log(`  admin ready: ${address}`);
  }
  if (adminAddresses.size === 0) {
    console.log(
      '  no ADMIN_WALLET_ADDRESSES set — nobody has admin access yet. ' +
        'Set it in .env and re-run `npx prisma db seed`, or update a user\'s role directly.',
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
