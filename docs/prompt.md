[

  { "id": "01", "title": "LATIN – PHILO" },

  { "id": "02", "title": "LATIN – LANGUE" },

  { "id": "03", "title": "LATIN – SCIENTIFIQUE" },

  { "id": "04", "title": "LATIN – MATHÉMATIQUE" },

  { "id": "05", "title": "SCIENTIFIQUE" },

  { "id": "06", "title": "MATHÉMATIQUE" },

  { "id": "07", "title": "ÉCONOMIQUE" },

  { "id": "08", "title": "SOCIALE" },

  { "id": "09", "title": "COMMERCIALE ET GESTION" },

  { "id": "10", "title": "SOCIALE ET ADMINISTRATION" },

  { "id": "11", "title": "ÉLECTRICITÉ" },

  { "id": "12", "title": "MÉCANIQUE GÉNÉRALE" },

  { "id": "13", "title": "MÉCANIQUE AUTO" },

  { "id": "14", "title": "MÉCANIQUE DESSIN" },

  { "id": "15", "title": "ÉLECTRONIQUE" },

  { "id": "16", "title": "CONSTRUCTION" },

  { "id": "17", "title": "CHIMIE" },

  { "id": "18", "title": "INFORMATIQUE" },

  { "id": "19", "title": "ARTS PLASTIQUES" },

  { "id": "20", "title": "COUPE COUTURE" },

  { "id": "21", "title": "ARTS DRAMATIQUES" },

  { "id": "22", "title": "ESTHÉTIQUE ET COIFFURE" },

  { "id": "23", "title": "HÔTELLERIE ET RESTAURATION" },

  { "id": "24", "title": "TOURISME" },

  { "id": "25", "title": "HÔTESSE D'ACCUEIL" },

  { "id": "26", "title": "AGRICULTURE GÉNÉRALE" },

  { "id": "27", "title": "VÉTÉRINAIRE" },

  { "id": "28", "title": "AGRONOMIE" },

  { "id": "29", "title": "INDUSTRIES AGRICOLES" },

  { "id": "30", "title": "PÊCHE ET NAVIGATION" }

]

these are sections

import {

  Column,

  DataType,

  Default,

  HasMany,

  Model,

  Table,

} from 'sequelize-typescript';

import { ItemCourse } from './item-course.model';

export enum ItemTypeEnum {

  CULTURE_GENERALE = 'cg',

  SCIENCES = 'sc',

  COURS_OPTIONS = 'co',

  LANGUES = 'la',

}

interface ItemCreationAttributes {

  type: ItemTypeEnum;

  section_id: string;

  year: number;

  universal?: boolean;

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

    allowNull: false,

  })

  declare type: ItemTypeEnum;

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

  @HasMany(() => ItemCourse)

  declare courses: ItemCourse[];

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

I want to create a seed to create from 1967 - 2026 to have 4 types of question sur base de ces enums par annee export enum ItemTypeEnum {

  CULTURE_GENERALE = 'cg',

  SCIENCES = 'sc',

  COURS_OPTIONS = 'co',

  LANGUES = 'la',

}



and if that year and item exist do not overwrite it skip that that year and that itemtype and continue to check whether all remainding item exist if not create them else skip the year 



and also give me how to integrate it inside my nestjs app and how to run the seed