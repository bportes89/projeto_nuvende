import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

let dbUrl = process.env.DATABASE_URL;

console.log('[Prisma Config] Initializing...');

if (!dbUrl) {
  console.error('[Prisma Config] CRITICAL: DATABASE_URL is missing.');
} else {
  // Sanitize URL: remove quotes and whitespace
  dbUrl = dbUrl.trim().replace(/^["']|["']$/g, '');
  
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`[Prisma Config] Using sanitized DATABASE_URL: ${maskedUrl}`);
}

const directUrl = process.env.DIRECT_URL;
if (directUrl) {
  const maskedDirectUrl = directUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`[Prisma Config] Using sanitized DIRECT_URL: ${maskedDirectUrl}`);
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});
