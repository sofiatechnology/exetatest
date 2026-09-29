import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Sequelize } from 'sequelize-typescript';
import { Section } from '../../../src/models/section.model';
import { Course } from '../../../src/models/course.model';
import { Level } from '../../../src/models/level.model';
import { Modele } from '../../../src/models/modele.model';
import { Question } from '../../../src/models/question.model';

/** LATIN – PHILO section id (see scripts/migrations/005-create-sections.sql). */
export const LATIN_PHILO_SECTION_ID = '01';

/**
 * Parse course names from cours-list.md (numbered lines under the heading).
 */
export function parseCoursList(markdown: string): string[] {
  const names: string[] = [];
  for (const line of markdown.split(/\r?\n/)) {
    const match = line.match(/^\s*\d+\.\s+(.+?)\s*$/);
    if (match?.[1]) {
      names.push(match[1].trim());
    }
  }
  return names;
}

async function main() {
  const listPath = join(__dirname, '..', 'cours-list.md');
  const courseNames = parseCoursList(readFileSync(listPath, 'utf8'));

  if (courseNames.length === 0) {
    throw new Error(`No courses found in ${listPath}`);
  }

  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [Section, Course, Level, Modele, Question],
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  });

  await sequelize.authenticate();
  const transaction = await sequelize.transaction();

  try {
    const section = await Section.findByPk(LATIN_PHILO_SECTION_ID, {
      transaction,
    });
    if (!section) {
      throw new Error(
        `Section ${LATIN_PHILO_SECTION_ID} not found. Run npm run db:seed:sections first.`,
      );
    }

    let created = 0;
    let existing = 0;

    for (const name of courseNames) {
      const [course, wasCreated] = await Course.findOrCreate({
        where: {
          name,
          section_id: LATIN_PHILO_SECTION_ID,
        },
        defaults: {
          name,
          section_id: LATIN_PHILO_SECTION_ID,
        },
        transaction,
      });

      if (wasCreated) {
        created += 1;
        console.log(`Created course: ${course.name}`);
      } else {
        existing += 1;
        console.log(`Already linked: ${course.name}`);
      }
    }

    await transaction.commit();
    console.log(
      `LATIN – PHILO courses: ${created} created, ${existing} already present (${courseNames.length} total from list).`,
    );
  } catch (error) {
    await transaction.rollback();
    throw error;
  } finally {
    await sequelize.close();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
