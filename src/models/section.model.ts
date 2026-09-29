import { Column, DataType, Model, Table } from 'sequelize-typescript';

interface SectionCreationAttributes {
  id: string;
  name: string;
}

@Table({
  tableName: 'sections',
  timestamps: true,
})
export class Section extends Model<Section, SectionCreationAttributes> {
  @Column({
    type: DataType.STRING(64),
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

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
