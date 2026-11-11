import {
  Column,
  DataType,
  Default,
  BeforeValidate,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { ItemCourse } from './item-course.model';
import { Course } from './course.model';

export enum ItemTypeEnum {
  CULTURE_GENERALE = 'cg',
  SCIENCES = 'sc',
  COURS_OPTIONS = 'co',
  LANGUES = 'la',
}

export const ItemCategoryEnum = ItemTypeEnum;
export type ItemCategoryEnum = ItemTypeEnum;

interface ItemCreationAttributes {
  type?: ItemTypeEnum | null;
  category?: ItemCategoryEnum | null;
  section_id: string;
  year: number;
  universal?: boolean;
  is_all_sections?: boolean;
}

@Table({
  tableName: 'items',
  timestamps: true,
})
export class Item extends Model<Item, ItemCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(ItemTypeEnum)),
    allowNull: true,
  })
  declare type: ItemTypeEnum | null;

  @Column({
    type: DataType.ENUM(...Object.values(ItemCategoryEnum)),
    allowNull: true,
  })
  declare category: ItemCategoryEnum | null;

  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare section_id: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare year: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare universal: boolean;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare is_all_sections: boolean;

  @HasMany(() => ItemCourse)
  declare courses: ItemCourse[];

  @HasMany(() => Course)
  declare examCourses: Course[];

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

  @BeforeValidate
  static synchronizeCategoryFields(item: Item): void {
    if (item.isNewRecord) {
      item.category = item.category ?? item.type ?? null;
      item.type = item.type ?? item.category;
      const isAllSections = item.is_all_sections || item.universal;
      item.is_all_sections = isAllSections;
      item.universal = isAllSections;
      return;
    }

    if (item.changed('category') && !item.changed('type')) {
      if (item.category !== null) {
        item.type = item.category;
      }
    } else if (item.changed('type') && !item.changed('category')) {
      item.category = item.type;
    }

    if (item.changed('is_all_sections') && !item.changed('universal')) {
      item.universal = item.is_all_sections;
    } else if (item.changed('universal') && !item.changed('is_all_sections')) {
      item.is_all_sections = item.universal;
    }
  }
}
