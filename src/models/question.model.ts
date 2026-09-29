import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Level } from './level.model';
import { Modele } from './modele.model';

interface QuestionCreationAttributes {
  text: string;
  response: string[];
  correct_answer: number;
  time: number;
  level_id: number;
  modele_id: string;
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
    allowNull: false,
  })
  declare text: string;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: false,
  })
  declare response: string[];

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare correct_answer: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare time: number;

  @ForeignKey(() => Level)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare level_id: number;

  @BelongsTo(() => Level)
  declare level: Level;

  @ForeignKey(() => Modele)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare modele_id: string;

  @BelongsTo(() => Modele)
  declare modele: Modele;

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
