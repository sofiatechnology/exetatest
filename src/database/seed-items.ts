import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from 'src/app.module';
import { Item, ItemTypeEnum } from 'src/models/item.model';
import SECTIONS from 'src/sections/drc-sections.json';
import { Op } from 'sequelize';

const ITEM_TYPES = Object.values(ItemTypeEnum);
const START_YEAR = 2015;
const END_YEAR = 2026;

async function bootstrap() {
  console.log('🌱 Starting Items seed...');
  console.log(
    `📊 Scope: ${END_YEAR - START_YEAR + 1} years × ${SECTIONS.length} sections × ${ITEM_TYPES.length} types = ${(END_YEAR - START_YEAR + 1) * SECTIONS.length * ITEM_TYPES.length} total items\n`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const itemModel = app.get<typeof Item>(getModelToken(Item));

  // ─── Bulk-fetch all existing items once (avoids N+1 queries) ─────────────
  const existingItems = await itemModel.findAll({
    attributes: ['type', 'section_id', 'year'],
    where: {
      year: { [Op.between]: [START_YEAR, END_YEAR] },
    },
    raw: true,
  });

  // Build a Set of composite keys for O(1) lookup
  const existingKeys = new Set<string>(
    existingItems.map((i) => `${i.year}::${i.section_id}::${i.type}`),
  );

  console.log(`🔍 Found ${existingKeys.size} existing items in DB\n`);

  // ─── Build list of items to create ───────────────────────────────────────
  const toCreate: Array<{
    type: ItemTypeEnum;
    section_id: string;
    year: number;
    universal: boolean;
  }> = [];

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    for (const section of SECTIONS) {
      for (const type of ITEM_TYPES) {
        const key = `${year}::${section.id}::${type}`;
        if (!existingKeys.has(key)) {
          toCreate.push({
            type,
            section_id: section.id,
            year,
            universal: false,
          });
        }
      }
    }
  }

  const skipped =
    (END_YEAR - START_YEAR + 1) * SECTIONS.length * ITEM_TYPES.length -
    toCreate.length;

  if (toCreate.length === 0) {
    console.log('✅ All items already exist — nothing to create.');
    await app.close();
    process.exit(0);
  }

  console.log(`⏭️  Skipping ${skipped} existing items`);
  console.log(`➕ Creating ${toCreate.length} new items in batches...\n`);

  // ─── Bulk insert in chunks of 500 to avoid huge SQL statements ───────────
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < toCreate.length; i += CHUNK_SIZE) {
    const chunk = toCreate.slice(i, i + CHUNK_SIZE);
    await itemModel.bulkCreate(chunk);
    inserted += chunk.length;
    process.stdout.write(
      `\r💾 Inserted ${inserted} / ${toCreate.length} items...`,
    );
  }

  console.log(`\n\n✅ Seed complete!`);
  console.log(`   Created  : ${inserted}`);
  console.log(`   Skipped  : ${skipped}`);
  console.log(
    `   Total    : ${inserted + skipped} / ${(END_YEAR - START_YEAR + 1) * SECTIONS.length * ITEM_TYPES.length}`,
  );

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
