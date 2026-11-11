import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { GameSession } from './game-session.model';
import { User } from './user.model';
import { PlayerAnswer } from './player-answer.model';

interface GamePlayerCreationAttributes {
  game_session_id: string;
  nickname: string;
  user_id?: string | null;
  score?: number;
  joined_at?: Date;
}

@Table({
  tableName: 'game_players',
  timestamps: true,
})
export class GamePlayer extends Model<
  GamePlayer,
  GamePlayerCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => GameSession)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare game_session_id: string;

  @BelongsTo(() => GameSession)
  declare gameSession: GameSession;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare user_id: string | null;

  @BelongsTo(() => User)
  declare user: User | null;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  declare nickname: string;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare score: number;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare joined_at: Date;

  @HasMany(() => PlayerAnswer)
  declare answers: PlayerAnswer[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
