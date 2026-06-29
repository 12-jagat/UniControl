import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Fetching all public tables...");
  const tables: { tablename: string }[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public';`
  );

  console.log(`Found ${tables.length} tables. Dropping them...`);
  for (const table of tables) {
    console.log(`Dropping table: "${table.tablename}"...`);
    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE;`);
  }

  const types: { typname: string }[] = await prisma.$queryRawUnsafe(
    `SELECT t.typname FROM pg_type t JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e';`
  );
  console.log(`Found ${types.length} custom enum types. Dropping them...`);
  for (const type of types) {
    console.log(`Dropping type: "${type.typname}"...`);
    await prisma.$executeRawUnsafe(`DROP TYPE IF EXISTS "${type.typname}" CASCADE;`);
  }

  console.log("✨ Database successfully wiped!");
}

main()
  .catch((e) => {
    console.error("❌ Failed to wipe database:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
