import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Revision } from './revision.model';
import { Question } from './question.model';

interface RevisionQuestionCreationAttributes {
  revision_id: string;
  question_id: string;
  question_order: number;
  time_limit?: number | null;
}

@Table({
  tableName: 'revision_questions',
  timestamps: true,
})
export class RevisionQuestion extends Model<
  RevisionQuestion,
  RevisionQuestionCreationAttributes
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

  @ForeignKey(() => Question)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare question_id: string;

  @BelongsTo(() => Question)
  declare question: Question;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare question_order: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare time_limit: number | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
