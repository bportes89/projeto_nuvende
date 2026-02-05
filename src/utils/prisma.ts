import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;

console.log('[Prisma Config] Checking environment variables...');

if (!dbUrl) {
  console.error('[Prisma Config] CRITICAL: DATABASE_URL is missing or empty.');
} else {
  // Mask password for safety
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`[Prisma Config] DATABASE_URL is set: ${maskedUrl}`);
  
  if (!dbUrl.startsWith('postgres://') && !dbUrl.startsWith('postgresql://')) {
     console.error('[Prisma Config] CRITICAL: DATABASE_URL does not start with postgres:// or postgresql://');
  }
}

export const prisma = new PrismaClient();
