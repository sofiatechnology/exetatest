import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from '../models/course.model';
import { Level } from '../models/level.model';
import { User } from '../models/user.model';
import { LevelService } from './level.service';
import { LevelController } from './level.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([Level, Course, User])],
  providers: [LevelService, RolesGuard],
  controllers: [LevelController],
  exports: [LevelService],
})
export class LevelModule {}
