import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Level } from './level.model';
import { Modele } from './modele.model';
import { Course } from './course.model';
import { QuestionResponse } from './question-response.model';

interface QuestionCreationAttributes {
  text?: string | null;
  response?: string[] | null;
  correct_answer?: number | null;
  time?: number | null;
  level_id?: number | null;
  modele_id?: string | null;
  course_id?: string | null;
  question?: string | null;
  time_limit?: number | null;
}

@Table({
  tableName: 'question',
  timestamps: true,
})
export class Question extends Model<Question, QuestionCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare text: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare question: string | null;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: true,
  })
  declare response: string[] | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare correct_answer: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare time: number | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare time_limit: number | null;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare course_id: string | null;

  @BelongsTo(() => Course)
  declare course: Course | null;

  @ForeignKey(() => Level)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare level_id: number | null;

  @BelongsTo(() => Level)
  declare level: Level | null;

  @ForeignKey(() => Modele)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare modele_id: string | null;

  @BelongsTo(() => Modele)
  declare modele: Modele | null;

  @HasMany(() => QuestionResponse)
  declare responses: QuestionResponse[];

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare updatedAt: Date;
}
