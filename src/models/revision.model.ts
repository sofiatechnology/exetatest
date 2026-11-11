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
import { User } from './user.model';
import { RevisionQuestion } from './revision-question.model';
import { GameSession } from './game-session.model';

interface RevisionCreationAttributes {
  user_id: string;
  title: string;
  auto_scroll?: boolean;
  is_public?: boolean;
}

@Table({
  tableName: 'revisions',
  timestamps: true,
})
export class Revision extends Model<Revision, RevisionCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare user_id: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  declare title: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare auto_scroll: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    field: 'public',
  })
  declare is_public: boolean;

  @HasMany(() => RevisionQuestion)
  declare questions: RevisionQuestion[];

  @HasMany(() => GameSession)
  declare gameSessions: GameSession[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
