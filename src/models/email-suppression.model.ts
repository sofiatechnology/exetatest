import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';

export enum EmailSuppressionReason {
  HARD_BOUNCE = 'hard_bounce',
  SOFT_BOUNCE = 'soft_bounce',
  COMPLAINT = 'complaint',
  UNSUBSCRIBE = 'unsubscribe',
}

interface EmailSuppressionCreationAttributes {
  email: string;
  reason: EmailSuppressionReason;
  softBounceCount?: number;
}

@Table({
  tableName: 'email_suppressions',
  timestamps: true,
})
export class EmailSuppression extends Model<
  EmailSuppression,
  EmailSuppressionCreationAttributes
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.ENUM(...Object.values(EmailSuppressionReason)),
    allowNull: false,
  })
  declare reason: EmailSuppressionReason;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare softBounceCount: number;

  declare createdAt: Date;
  declare updatedAt: Date;
}
