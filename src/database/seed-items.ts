// src/database/seeds/seed-items.ts
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from 'src/app.module';
import { Item, ItemTypeEnum } from 'src/models/item.model';
// import SECTIONS from 'src/sections/drc-sections.json'; we should use the json file but for now we will hardcode the sections in this file
import { Op } from 'sequelize';

const SECTIONS = [
  {
    "id": "01",
    "title": "LATIN – PHILO"
  },
  {
    "id": "02",
    "title": "LATIN – LANGUE"
  },
  {
    "id": "03",
    "title": "LATIN – SCIENTIFIQUE"
  },
  {
    "id": "04",
    "title": "LATIN – MATHÉMATIQUE"
  },
  {
    "id": "05",
    "title": "SCIENTIFIQUE"
  },
  {
    "id": "06",
    "title": "MATHÉMATIQUE"
  },
  {
    "id": "07",
    "title": "ÉCONOMIQUE"
  },
  {
    "id": "08",
    "title": "SOCIALE"
  },
  {
    "id": "09",
    "title": "COMMERCIALE ET GESTION"
  },
  {
    "id": "10",
    "title": "SOCIALE ET ADMINISTRATION"
  },
  {
    "id": "11",
    "title": "ÉLECTRICITÉ"
  },
  {
    "id": "12",
    "title": "MÉCANIQUE GÉNÉRALE"
  },
  {
    "id": "13",
    "title": "MÉCANIQUE AUTO"
  },
  {
    "id": "14",
    "title": "MÉCANIQUE DESSIN"
  },
  {
    "id": "15",
    "title": "ÉLECTRONIQUE"
  },
  {
    "id": "16",
    "title": "CONSTRUCTION"
  },
  {
    "id": "17",
    "title": "CHIMIE"
  },
  {
    "id": "18",
    "title": "INFORMATIQUE"
  },
  {
    "id": "19",
    "title": "ARTS PLASTIQUES"
  },
  {
    "id": "20",
    "title": "COUPE COUTURE"
  },
  {
    "id": "21",
    "title": "ARTS DRAMATIQUES"
  },
  {
    "id": "22",
    "title": "ESTHÉTIQUE ET COIFFURE"
  },
  {
    "id": "23",
    "title": "HÔTELLERIE ET RESTAURATION"
  },
  {
    "id": "24",
    "title": "TOURISME"
  },
  {
    "id": "25",
    "title": "HÔTESSE D'ACCUEIL"
  },
  {
    "id": "26",
    "title": "AGRICULTURE GÉNÉRALE"
  },
  {
    "id": "27",
    "title": "VÉTÉRINAIRE"
  },
  {
    "id": "28",
    "title": "AGRONOMIE"
  },
  {
    "id": "29",
    "title": "INDUSTRIES AGRICOLES"
  },
  {
    "id": "30",
    "title": "PÊCHE ET NAVIGATION"
  },
  {
    "id": "31",
    "title": "MATH-PHYSIQUE"
  },
  {
    "id": "32",
    "title": "BIOLOGIE CHIMIE"
  },
  {
    "id": "33",
    "title": "PÉDAGOGIE GÉNÉRALE"
  },
  {
    "id": "34",
    "title": "COMMERCIALE ADMINISTRATIVE"
  },
  {
    "id": "35",
    "title": "SOC"
  },
  {
    "id": "36",
    "title": "COMMERCIALE ET INFORMATIQUE"
  },
  {
    "id": "37",
    "title": "NUTRITION"
  },
  {
    "id": "38",
    "title": "ÉDUCATION"
  },
  {
    "id": "39",
    "title": "MENUISERIE"
  },
  {
    "id": "40",
    "title": "EBÉNISTERIE"
  },
  {
    "id": "41",
    "title": "INDUSTRIELLE"
  },
  {
    "id": "42",
    "title": "LITTÉRAIRE"
  },
  {
    "id": "43",
    "title": "ESTHÉTIQUE"
  },
  {
    "id": "44",
    "title": "NORMALE"
  },
  {
    "id": "45",
    "title": "TECHNIQUE AGRICOLE"
  },
  {
    "id": "46",
    "title": "TECHNIQUE SOCIALE"
  },
  {
    "id": "47",
    "title": "CON"
  },
  {
    "id": "48",
    "title": "AGRI-GÉN"
  },
  {
    "id": "49",
    "title": "TECHNOLOGIE AGRICOLE"
  },
  {
    "id": "50",
    "title": "MAÇONNERIE"
  },
  {
    "id": "51",
    "title": "AGRI VÉTÉRINAIRE"
  },
  {
    "id": "52",
    "title": "PRODUCTION ET SANTÉ ANIMALE"
  },
  {
    "id": "53",
    "title": "AGRO-FORESTERIE"
  },
  {
    "id": "54",
    "title": "MINE ET GÉOLOGIE"
  },
  {
    "id": "55",
    "title": "SECRÉTARIAT-ADMINISTRATION"
  },
  {
    "id": "56",
    "title": "FORESTERIE"
  },
  {
    "id": "57",
    "title": "HÉBERGEMENT"
  },
  {
    "id": "58",
    "title": "MÉCANIQUE MACHINE OUTILS"
  },
  {
    "id": "59",
    "title": "CHIMIE INDUSTRIELLE"
  },
  {
    "id": "60",
    "title": "IMPRIMERIE"
  },
  {
    "id": "61",
    "title": "COMMUTATION"
  },
  {
    "id": "62",
    "title": "MÉTÉOROLOGIE"
  }
];

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
