import { randomInt } from 'node:crypto';
import {
  BeforeValidate,
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { User } from './user.model';
import { Revision } from './revision.model';
import { GamePlayer } from './game-player.model';

export enum GameSessionStatus {
  WAITING = 'waiting',
  ACTIVE = 'active',
  ENDED = 'ended',
}

interface GameSessionCreationAttributes {
  revision_id: string;
  host_id: string;
  pin_code?: string;
  status?: GameSessionStatus;
  current_question_index?: number;
  started_at?: Date | null;
  question_started_at?: Date | null;
  ended_at?: Date | null;
}

@Table({
  tableName: 'game_sessions',
  timestamps: true,
})
export class GameSession extends Model<
  GameSession,
  GameSessionCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Revision)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare revision_id: string;

  @BelongsTo(() => Revision)
  declare revision: Revision;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare host_id: string;

  @BelongsTo(() => User)
  declare host: User;

  @Column({
    type: DataType.STRING(6),
    allowNull: false,
    unique: true,
  })
  declare pin_code: string;

  @Default(GameSessionStatus.WAITING)
  @Column({
    type: DataType.ENUM(...Object.values(GameSessionStatus)),
    allowNull: false,
  })
  declare status: GameSessionStatus;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare current_question_index: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare started_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare question_started_at: Date | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare ended_at: Date | null;

  @HasMany(() => GamePlayer)
  declare players: GamePlayer[];

  declare createdAt: Date;
  declare updatedAt: Date;

  @BeforeValidate
  static async generatePinCode(session: GameSession): Promise<void> {
    if (session.pin_code) {
      return;
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const pinCode = randomInt(100000, 1000000).toString();
      const existingSession = await GameSession.findOne({
        where: { pin_code: pinCode },
        attributes: ['id'],
      });
      if (!existingSession) {
        session.pin_code = pinCode;
        return;
      }
    }

    throw new Error('Unable to generate a unique game PIN');
  }
}
