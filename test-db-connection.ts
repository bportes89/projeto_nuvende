
import { PrismaClient } from '@prisma/client';

async function testConnection() {
    console.log(`Testing Supabase Connection Pooler...`);
    const prisma = new PrismaClient(); // Will read from .env
    try {
        await prisma.$connect();
        console.log(`✅ Success: Connected to Supabase via Pooler!`);
        
        // Try to query users
        const count = await prisma.user.count();
        console.log(`✅ User count: ${count}`);
        
        // Check for admin
        const admin = await prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });
        if (admin) {
            console.log(`✅ Admin found: ${admin.email}`);
        } else {
            console.log(`⚠️ No Admin found`);
        }

        await prisma.$disconnect();
        return true;
    } catch (e: any) {
        console.log(`❌ Failed: ${e.message}`);
        return false;
    }
}

testConnection();
