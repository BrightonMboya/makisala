import postgres from 'postgres';
import { env } from './src/env';

const sql = postgres(env.DATABASE_URL);

interface ContentData {
  accommodationId: string;
  enhancedDescription: string;
  amenities: { category: string; items: string[] }[];
  roomTypes: { name: string; description: string; capacity?: string }[];
  locationHighlights: string[];
  pricingInfo: string | null;
}

async function insertContent(data: ContentData) {
  await sql`
    UPDATE accommodations SET
      enhanced_description = ${data.enhancedDescription},
      amenities = ${JSON.stringify(data.amenities)},
      room_types = ${JSON.stringify(data.roomTypes)},
      location_highlights = ${data.locationHighlights},
      pricing_info = ${data.pricingInfo}
    WHERE id = ${data.accommodationId}
  `;
  console.log(`Updated content for ${data.accommodationId}`);
}

try {
  const input = await Bun.stdin.text();
  const items: ContentData[] = JSON.parse(input);

  for (const item of items) {
    await insertContent(item);
  }

  console.log(`Processed ${items.length} accommodations`);
} catch (error) {
  console.error('Failed to process content data:', error);
  process.exitCode = 1;
} finally {
  await sql.end();
}
