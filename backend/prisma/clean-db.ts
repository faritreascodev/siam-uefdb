import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Cleaning database...');
    // Delete all records in appropriate order to avoid foreign key constraints
    // Prisma allows deleting everything with raw query or using deleteMany for each model
    // A raw query truncate is easiest for PostgreSQL

    const tableNames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public';
  `;

    for (const { tablename } of tableNames) {
        if (tablename !== '_prisma_migrations') {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
                console.log(`Truncated table ${tablename}`);
            } catch (error) {
                console.log(`Error truncating ${tablename}: ${error}`);
            }
        }
    }

    console.log('Database cleaned.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
