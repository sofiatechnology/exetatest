import {
  Column,
  DataType,
  Default,
  Model,
  Table,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from './user.model';

interface OtpCreationAttributes {
  userId: string;
  code: string;
  expiresAt: Date;
  isVerified?: boolean;
  attemptCount?: number;
  requestIp?: string | null;
}

@Table({
  tableName: 'otps',
  timestamps: true,
})
export class Otp extends Model<Otp, OtpCreationAttributes> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isVerified: boolean;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare attemptCount: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare requestIp: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
