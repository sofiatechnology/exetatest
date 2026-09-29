import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Modele } from '../models/modele.model';
import { User } from '../models/user.model';
import { ModeleService } from './modele.service';
import { ModeleController } from './modele.controller';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
  imports: [SequelizeModule.forFeature([Modele, User])],
  providers: [ModeleService, RolesGuard],
  controllers: [ModeleController],
  exports: [ModeleService],
})
export class ModeleModule {}
