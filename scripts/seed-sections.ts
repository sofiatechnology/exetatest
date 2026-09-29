import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Sequelize } from 'sequelize-typescript';
import { Section } from '../src/models/section.model';

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

  const migrationPath = join(
    __dirname,
    'migrations',
    '005-create-sections.sql',
  );
  const sql = readFileSync(migrationPath, 'utf8');
  await sequelize.query(sql);

  const count = await Section.count();
  // eslint-disable-next-line no-console
  console.log(`Sections table ready with ${count} rows.`);
  await sequelize.close();
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error('Seed sections failed:', err);
  process.exitCode = 1;
});
