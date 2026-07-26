import { Column, DataType, Model, Table, Unique } from 'sequelize-typescript';

interface WebhookEventCreationAttributes {
  eventId: string;
  eventType: string;
}

@Table({
  tableName: 'webhook_events',
  timestamps: true,
  updatedAt: false,
})
export class WebhookEvent extends Model<
  WebhookEvent,
  WebhookEventCreationAttributes
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
  declare eventId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare eventType: string;

  declare createdAt: Date;
}
