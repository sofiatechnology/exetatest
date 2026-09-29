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

interface CourseCreationAttributes {
  name: string;
  section_id: string;
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

  @ForeignKey(() => Section)
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare section_id: string;

  @BelongsTo(() => Section)
  declare section: Section;

  @HasMany(() => Level)
  declare levels: Level[];

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
