
import { db } from './src/index';
import { proposals } from './src/schema';
import { isNull } from 'drizzle-orm';

async function main() {
  const nullProposals = await db.select().from(proposals).where(isNull(proposals.tourId));
  console.log('Proposals with null tourId:', nullProposals.length);
  
  if (nullProposals.length > 0) {
    console.log('Deleting proposals with null tourId...');
    await db.delete(proposals).where(isNull(proposals.tourId));
    console.log('Done.');
  }
}

main().catch(console.error);
