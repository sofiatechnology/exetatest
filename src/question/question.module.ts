import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Question } from '../models/question.model';
import { Level } from '../models/level.model';
import { Modele } from '../models/modele.model';
import { User } from '../models/user.model';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([Question, Level, Modele, User])],
  providers: [QuestionService, RolesGuard],
  controllers: [QuestionController],
  exports: [QuestionService],
})
export class QuestionModule {}
