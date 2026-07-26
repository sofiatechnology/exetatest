import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { EmailSuppression } from '../models/email-suppression.model';
import { WebhookEvent } from '../models/webhook-event.model';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [SequelizeModule.forFeature([EmailSuppression, WebhookEvent])],
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
