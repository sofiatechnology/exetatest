import 'dotenv/config';
import { Sequelize } from 'sequelize-typescript';
import { Item, ItemTypeEnum } from '../../src/models/item.model';
import { ItemCourse } from '../../src/models/item-course.model';
import { ItemQuestion } from '../../src/models/item-question.model';
import { years } from './exetat';

const SECTION_ID = '09';

const ITEM_TYPE: Record<'cg' | 'sc' | 'co' | 'la', ItemTypeEnum> = {
  cg: ItemTypeEnum.CULTURE_GENERALE,
  sc: ItemTypeEnum.SCIENCES,
  co: ItemTypeEnum.COURS_OPTIONS,
  la: ItemTypeEnum.LANGUES,
};

async function main() {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    models: [Item, ItemCourse, ItemQuestion],
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
    const existing = await Item.findAll({
      where: { section_id: SECTION_ID },
      transaction,
    });
    const itemIds = existing.map((item) => item.id);

    if (itemIds.length > 0) {
      const courses = await ItemCourse.findAll({
        where: { item_id: itemIds },
        transaction,
      });
      const courseIds = courses.map((course) => course.id);
      if (courseIds.length > 0) {
        const removedQuestions = await ItemQuestion.destroy({
          where: { item_course_id: courseIds },
          transaction,
        });
        console.log(`Removed ${removedQuestions} questions for section ${SECTION_ID}`);
        const removedCourses = await ItemCourse.destroy({
          where: { item_id: itemIds },
          transaction,
        });
        console.log(`Removed ${removedCourses} courses for section ${SECTION_ID}`);
      }
      const removedItems = await Item.destroy({
        where: { id: itemIds },
        transaction,
      });
      console.log(`Removed ${removedItems} items for section ${SECTION_ID}`);
    } else {
      console.log(`No existing items for section ${SECTION_ID}`);
    }

    let itemCount = 0;
    let courseCount = 0;
    let questionCount = 0;

    for (const year of years) {
      for (const item of year.items) {
        const created = await Item.create(
          {
            type: ITEM_TYPE[item.type],
            section_id: SECTION_ID,
            year: year.year,
            universal: false,
          },
          { transaction },
        );
        itemCount += 1;

        for (const course of item.courses) {
          const courseRow = await ItemCourse.create(
            {
              course: course.course,
              item_id: created.id,
              passage: course.passage,
            },
            { transaction },
          );
          courseCount += 1;

          if (course.questions.length === 0) {
            continue;
          }

          await ItemQuestion.bulkCreate(
            course.questions.map((question) => ({
              question: question.question,
              item_course_id: courseRow.id,
              options: question.options,
              answer: question.answer,
            })),
            { transaction },
          );
          questionCount += course.questions.length;
        }
      }
    }

    await transaction.commit();
    console.log(
      `Inserted ${itemCount} items, ${courseCount} courses, ${questionCount} questions for section ${SECTION_ID}`,
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
