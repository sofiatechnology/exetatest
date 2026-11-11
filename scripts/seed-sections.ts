import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { Section } from '../src/models/section.model';

const SEED_SECTIONS_SQL = `
  CREATE TABLE IF NOT EXISTS "sections" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  INSERT INTO "sections" ("id", "name", "createdAt", "updatedAt") VALUES
    ('01', 'LATIN – PHILO', NOW(), NOW()),
    ('02', 'SCIENTIFIQUE', NOW(), NOW()),
    ('03', 'COMMERCIALE ET GESTION', NOW(), NOW()),
    ('04', 'ELECTRICITE', NOW(), NOW()),
    ('05', 'MECANIQUE', NOW(), NOW()),
    ('06', 'ELECTRONIQUE', NOW(), NOW()),
    ('07', 'CONSTRUCTION', NOW(), NOW()),
    ('08', 'COUPE COUTURE', NOW(), NOW()),
    ('09', 'HOTELLERIE ET RESTAURATION', NOW(), NOW()),
    ('10', 'TOURISME', NOW(), NOW()),
    ('11', 'HOTESSE D''ACCUEIL', NOW(), NOW()),
    ('12', 'AGRICULTURE', NOW(), NOW()),
    ('13', 'VETERINAIRE', NOW(), NOW()),
    ('14', 'AGRONOMIE', NOW(), NOW()),
    ('15', 'PECHE ET NAVIGATION', NOW(), NOW()),
    ('16', 'PEDAGOGIE', NOW(), NOW()),
    ('17', 'NUTRITION', NOW(), NOW()),
    ('18', 'TECHNIQUE SOCIALE', NOW(), NOW())
  ON CONFLICT ("id") DO UPDATE SET
    "name" = EXCLUDED."name",
    "updatedAt" = NOW();
`;

async function main() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [Section],
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: console.log,
  });

  await sequelize.authenticate();

  await sequelize.query(SEED_SECTIONS_SQL);

  const count = await Section.count();
  console.log(`Sections table ready with ${count} rows.`);
  await sequelize.close();
}

main().catch(async (err) => {
  console.error('Seed sections failed:', err);
  process.exitCode = 1;
});
