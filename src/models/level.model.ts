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
