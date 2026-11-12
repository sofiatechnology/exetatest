import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthModule } from '../auth/auth.module';
import { GamePlayer } from '../models/game-player.model';
import { GameSession } from '../models/game-session.model';
import { PlayerAnswer } from '../models/player-answer.model';
import { Question } from '../models/question.model';
import { QuestionResponse } from '../models/question-response.model';
import { Revision } from '../models/revision.model';
import { RevisionQuestion } from '../models/revision-question.model';
import { GameController } from './game.controller';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';

@Module({
  imports: [
    AuthModule,
    SequelizeModule.forFeature([
      GameSession,
      GamePlayer,
      PlayerAnswer,
      Revision,
      RevisionQuestion,
      Question,
      QuestionResponse,
    ]),
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
})
export class GameModule {}
