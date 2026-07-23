// src/database/seeds/cleanup-pre-2015.ts
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/sequelize';
import { AppModule } from 'src/app.module';
import { Item } from 'src/models/item.model';
import { ItemCourse } from 'src/models/item-course.model';
import { ItemQuestion } from 'src/models/item-question.model';
import { Op } from 'sequelize';

async function bootstrap() {
  console.log('🧹 Starting cleanup of pre-2015 data...\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  const itemModel = app.get<typeof Item>(getModelToken(Item));
  const courseModel = app.get<typeof ItemCourse>(getModelToken(ItemCourse));
  const questionModel = app.get<typeof ItemQuestion>(
    getModelToken(ItemQuestion),
  );

  try {
    // ─── Step 1: Find all items with year < 2015 ──────────────────────────
    console.log('🔍 Finding items with year < 2015...');

    const itemsToDelete = await itemModel.findAll({
      where: {
        year: { [Op.lt]: 2015 },
      },
      attributes: ['id', 'year', 'section_id', 'type'],
      raw: true,
    });

    if (itemsToDelete.length === 0) {
      console.log('✅ No items found with year < 2015. Nothing to clean up.');
      await app.close();
      process.exit(0);
    }

    console.log(`   Found ${itemsToDelete.length} items to delete\n`);

    // ─── Step 2: Get all item IDs to delete ──────────────────────────────
    const itemIds = itemsToDelete.map((item) => item.id);

    // ─── Step 3: Find and delete related courses ──────────────────────────
    console.log('🔍 Finding related courses...');
    const coursesToDelete = await courseModel.findAll({
      where: {
        item_id: { [Op.in]: itemIds },
      },
      attributes: ['id', 'item_id'],
      raw: true,
    });

    const courseIds = coursesToDelete.map((course) => course.id);
    console.log(`   Found ${courseIds.length} related courses`);

    if (courseIds.length > 0) {
      // ─── Step 4: Delete questions related to those courses ──────────────
      console.log('🗑️  Deleting related questions...');
      const questionsDeleted = await questionModel.destroy({
        where: {
          item_course_id: { [Op.in]: courseIds },
        },
      });
      console.log(`   Deleted ${questionsDeleted} questions`);
    }

    // ─── Step 5: Delete courses ──────────────────────────────────────────────
    if (courseIds.length > 0) {
      console.log('🗑️  Deleting courses...');
      const coursesDeleted = await courseModel.destroy({
        where: {
          id: { [Op.in]: courseIds },
        },
      });
      console.log(`   Deleted ${coursesDeleted} courses`);
    }

    // ─── Step 6: Delete items ──────────────────────────────────────────────
    console.log('🗑️  Deleting items...');
    const itemsDeleted = await itemModel.destroy({
      where: {
        id: { [Op.in]: itemIds },
      },
    });
    console.log(`   Deleted ${itemsDeleted} items`);

    // ─── Summary ────────────────────────────────────────────────────────────
    console.log('\n✅ Cleanup complete!');
    console.log(`   Items deleted   : ${itemsDeleted}`);
    console.log(`   Courses deleted : ${courseIds.length}`);
    // console.log(`   Questions deleted: ${questionsDeleted || 0}`);
    console.log(`   Questions deleted: ${0}`);

    // Show which years were affected
    const yearsAffected = [...new Set(itemsToDelete.map((i) => i.year))].sort();
    console.log(`   Years removed   : ${yearsAffected.join(', ')}`);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error);
    throw error;
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap().catch((err) => {
  console.error('\n❌ Cleanup failed:', err);
  process.exit(1);
});
