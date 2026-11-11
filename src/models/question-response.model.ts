import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Question } from './question.model';

interface QuestionResponseCreationAttributes {
  question_id: string;
  option_text: string;
  question?: string | null;
  is_correct?: boolean;
}

@Table({
  tableName: 'responses',
  timestamps: true,
})
export class QuestionResponse extends Model<
  QuestionResponse,
  QuestionResponseCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Question)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare question_id: string;

  @BelongsTo(() => Question)
  declare questionRecord: Question;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare question: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare option_text: string;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_correct: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
