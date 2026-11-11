import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Section } from './section.model';
import { Level } from './level.model';
import { Item } from './item.model';
import { Question } from './question.model';

interface CourseCreationAttributes {
  name: string;
  section_id?: string | null;
  item_id?: string | null;
  title?: string | null;
  passage?: string | null;
}

@Table({
  tableName: 'courses',
  timestamps: true,
})
export class Course extends Model<Course, CourseCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @ForeignKey(() => Item)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare item_id: string | null;

  @BelongsTo(() => Item)
  declare item: Item | null;

  @ForeignKey(() => Section)
  @Column({
    type: DataType.STRING(64),
    allowNull: true,
  })
  declare section_id: string | null;

  @BelongsTo(() => Section)
  declare section: Section | null;

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

  @HasMany(() => Level)
  declare levels: Level[];

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
