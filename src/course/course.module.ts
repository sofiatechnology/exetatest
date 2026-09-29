import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { User } from '../models/user.model';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([Course, Section, User])],
  providers: [CourseService, RolesGuard],
  controllers: [CourseController],
  exports: [CourseService],
})
export class CourseModule {}
