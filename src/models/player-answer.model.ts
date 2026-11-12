import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { GamePlayer } from './game-player.model';
import { Question } from './question.model';
import { QuestionResponse } from './question-response.model';

interface PlayerAnswerCreationAttributes {
  game_player_id: string;
  question_id: string;
  response_id: string;
  is_correct: boolean;
  time_taken_ms: number;
  answered_at?: Date;
}

@Table({
  tableName: 'player_answers',
  timestamps: true,
  indexes: [
    {
      name: 'player_answers_game_player_question_unique',
      unique: true,
      fields: ['game_player_id', 'question_id'],
    },
  ],
})
export class PlayerAnswer extends Model<
  PlayerAnswer,
  PlayerAnswerCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => GamePlayer)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare game_player_id: string;

  @BelongsTo(() => GamePlayer)
  declare gamePlayer: GamePlayer;

  @ForeignKey(() => Question)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare question_id: string;

  @BelongsTo(() => Question)
  declare question: Question;

  @ForeignKey(() => QuestionResponse)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare response_id: string;

  @BelongsTo(() => QuestionResponse)
  declare response: QuestionResponse;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_correct: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare time_taken_ms: number;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare answered_at: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}
