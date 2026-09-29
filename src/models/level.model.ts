import {
  AutoIncrement,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Course } from './course.model';
import { Question } from './question.model';

interface LevelCreationAttributes {
  course_id: string;
  title?: string | null;
  passage?: string | null;
}

@Table({
  tableName: 'levels',
  timestamps: true,
})
export class Level extends Model<Level, LevelCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column({
    type: DataType.INTEGER,
  })
  declare id: number;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare course_id: string;

  @BelongsTo(() => Course)
  declare course: Course;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare title: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare passage: string | null;

  @HasMany(() => Question)
  declare questions: Question[];

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
