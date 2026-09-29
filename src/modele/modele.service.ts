import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { Modele } from '../models/modele.model';
import { CreateModeleDto } from './dto/create-modele.dto';
import { UpdateModeleDto } from './dto/update-modele.dto';
import { ModeleQueryDto } from './dto/modele-query.dto';
import { ModeleResponseDto } from './dto/modele-response.dto';

@Injectable()
export class ModeleService {
  constructor(
    @InjectModel(Modele)
    private readonly modeleModel: typeof Modele,
  ) {}

  private toResponse(modele: Modele): ModeleResponseDto {
    return {
      id: modele.id,
      title: modele.title,
      pin: modele.pin,
      auto_scroll: modele.auto_scroll,
      is_public: modele.is_public,
      created_at: modele.createdAt,
      updated_at: modele.updatedAt,
    };
  }

  private async getModeleOrFail(id: string): Promise<Modele> {
    const modele = await this.modeleModel.findByPk(id);
    if (!modele) {
      throw new NotFoundException('Modele introuvable');
    }
    return modele;
  }

  async create(dto: CreateModeleDto): Promise<ModeleResponseDto> {
    const title = dto.title.trim();
    if (!title) {
      throw new BadRequestException('title est requis');
    }
    const modele = await this.modeleModel.create({
      title,
      pin: dto.pin ?? false,
      auto_scroll: dto.auto_scroll ?? false,
      is_public: dto.is_public ?? false,
    });
    return this.toResponse(modele);
  }

  async findAll(query: ModeleQueryDto): Promise<{
    data: ModeleResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Modele> = {};
    if (query.is_public !== undefined) {
      where.is_public = query.is_public;
    }
    if (query.pin !== undefined) {
      where.pin = query.pin;
    }

    const options: FindOptions<Modele> = {
      where,
      order: [
        ['pin', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    };

    const { rows, count } = await this.modeleModel.findAndCountAll(options);
    return {
      data: rows.map((row) => this.toResponse(row)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ModeleResponseDto> {
    return this.toResponse(await this.getModeleOrFail(id));
  }

  async update(id: string, dto: UpdateModeleDto): Promise<ModeleResponseDto> {
    const modele = await this.getModeleOrFail(id);
    if (dto.title !== undefined) {
      const title = dto.title.trim();
      if (!title) {
        throw new BadRequestException('title est requis');
      }
      modele.title = title;
    }
    if (dto.pin !== undefined) {
      modele.pin = dto.pin;
    }
    if (dto.auto_scroll !== undefined) {
      modele.auto_scroll = dto.auto_scroll;
    }
    if (dto.is_public !== undefined) {
      modele.is_public = dto.is_public;
    }
    await modele.save();
    return this.toResponse(modele);
  }

  async remove(id: string): Promise<void> {
    const modele = await this.getModeleOrFail(id);
    await modele.destroy();
  }
}
