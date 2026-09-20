import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from 'src/app.module';
import { Item, ItemTypeEnum } from 'src/models/item.model';
import { ItemCourse } from 'src/models/item-course.model';
import { ItemQuestion } from 'src/models/item-question.model';

interface CollectedQuestion {
  question: string;
  options: string[];
  answer: number;
}

interface CollectedCourse {
  course: string;
  passage?: string | null;
  questions: CollectedQuestion[];
}

interface CollectedPaper {
  section_id: string;
  year: number;
  type: ItemTypeEnum;
  source?: string;
  courses: CollectedCourse[];
}

const TYPE_VALUES = new Set<string>(Object.values(ItemTypeEnum));
const COLLECTED_DIR = join(process.cwd(), 'scripts', 'lookup', 'collected');

function loadPapers(): CollectedPaper[] {
  const files = readdirSync(COLLECTED_DIR).filter(
    (name) => name.endsWith('.json') && name !== 'index.json',
  );

  return files.map((name) => {
    const raw = JSON.parse(
      readFileSync(join(COLLECTED_DIR, name), 'utf8'),
    ) as CollectedPaper;

    if (!TYPE_VALUES.has(raw.type)) {
      throw new Error(`Unknown item type in ${name}: ${raw.type}`);
    }

    return raw;
  });
}

async function bootstrap() {
  console.log('🌱 Starting lookup questions seed...\n');

  const papers = loadPapers();
  console.log(
    `📄 Found ${papers.length} collected papers in ${COLLECTED_DIR}\n`,
  );

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const itemModel = app.get<typeof Item>(getModelToken(Item));
  const courseModel = app.get<typeof ItemCourse>(getModelToken(ItemCourse));
  const questionModel = app.get<typeof ItemQuestion>(
    getModelToken(ItemQuestion),
  );
  const sequelize = itemModel.sequelize;

  if (sequelize) {
    await sequelize.query(
      'ALTER TABLE "item_questions" ALTER COLUMN "question" TYPE TEXT',
    );
    await sequelize.query(
      'ALTER TABLE "item_questions" ALTER COLUMN "options" TYPE TEXT[]',
    );
  }

  let coursesCreated = 0;
  let coursesSkipped = 0;
  let questionsCreated = 0;
  let itemsMissing = 0;

  for (const paper of papers) {
    const item = await itemModel.findOne({
      where: {
        year: paper.year,
        type: paper.type,
        section_id: paper.section_id,
      },
    });

    if (!item) {
      itemsMissing++;
      console.log(
        `⚠️  No item for section ${paper.section_id} ${paper.type} ${paper.year}. Run seed:items first.`,
      );
      continue;
    }

    console.log(
      `📦 ${paper.year} ${paper.type} (${paper.courses.length} course(s))`,
    );

    for (const courseData of paper.courses) {
      if (!courseData.questions.length) {
        console.log(`   ⏭️  ${courseData.course} has no usable questions.`);
        coursesSkipped++;
        continue;
      }

      let course = await courseModel.findOne({
        where: {
          item_id: item.id,
          course: courseData.course,
        },
      });

      if (course) {
        const existingCount = await questionModel.count({
          where: { item_course_id: course.id },
        });
        if (existingCount > 0) {
          console.log(`   ⏭️  ${courseData.course} already exists. Skipping.`);
          coursesSkipped++;
          continue;
        }
      } else {
        course = await courseModel.create({
          course: courseData.course,
          item_id: item.id,
          passage: courseData.passage || null,
        });
      }

      if (!course) {
        console.log(`   ⚠️  Could not create ${courseData.course}.`);
        continue;
      }

      await questionModel.bulkCreate(
        courseData.questions.map((question) => ({
          question: question.question,
          item_course_id: course.id,
          options: question.options,
          answer: question.answer,
        })),
      );

      coursesCreated++;
      questionsCreated += courseData.questions.length;
      console.log(
        `   ✅ ${courseData.course}: ${courseData.questions.length} questions`,
      );
    }
  }

  console.log('\n✅ Lookup seed complete!');
  console.log(`   Courses created : ${coursesCreated}`);
  console.log(`   Courses skipped : ${coursesSkipped}`);
  console.log(`   Questions created: ${questionsCreated}`);
  console.log(`   Missing items   : ${itemsMissing}`);

  await app.close();
  process.exit(0);
}

bootstrap().catch((err) => {
  console.error('\n❌ Seed failed:', err);
  process.exit(1);
});
