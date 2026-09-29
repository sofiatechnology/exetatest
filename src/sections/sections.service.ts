import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col } from 'sequelize';
import { Item } from '../models/item.model';
import { Section } from '../models/section.model';
import { User, UserRoleEnum } from '../models/user.model';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { SectionResponseDto } from './dto/section-response.dto';

/** Internal catalog shape used by profile/legacy matching (title = name). */
export type CatalogSection = {
  id: string;
  title: string;
};

export type AdminStatsResponse = {
  totalItems: number;
  totalSections: number;
  totalUsers: number;
  totalAdmins: number;
};

export type AdminSectionSummary = {
  section_id: string;
  title: string;
  itemCount: number;
};

@Injectable()
export class SectionsService implements OnModuleInit {
  private cache: CatalogSection[] = [];

  constructor(
    @InjectModel(Section)
    private readonly sectionModel: typeof Section,
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.reloadCache();
  }

  private toCatalogSection(section: Section): CatalogSection {
    return { id: section.id, title: section.name };
  }

  private toResponse(section: Section): SectionResponseDto {
    return {
      id: section.id,
      name: section.name,
      created_at: section.createdAt,
      updated_at: section.updatedAt,
    };
  }

  private async reloadCache(): Promise<void> {
    const rows = await this.sectionModel.findAll({
      order: [['id', 'ASC']],
    });
    this.cache = rows.map((row) => this.toCatalogSection(row));
  }

  private async getSectionOrFail(id: string): Promise<Section> {
    const section = await this.sectionModel.findByPk(id);
    if (!section) {
      throw new NotFoundException('Section introuvable');
    }
    return section;
  }

  /**
   * Validates a section id for profile PATCH. Returns null to clear. Throws if id is not found.
   */
  resolveSectionIdForProfile(raw: string | null | undefined): string | null {
    if (
      raw === null ||
      raw === undefined ||
      (typeof raw === 'string' && !raw.trim())
    ) {
      return null;
    }
    const id = String(raw).trim();
    if (!this.findById(id)) {
      throw new BadRequestException('Section introuvable');
    }
    return id;
  }

  getAllSections(): CatalogSection[] {
    return [...this.cache];
  }

  getSectionCount(): number {
    return this.cache.length;
  }

  findById(id: string): CatalogSection | undefined {
    return this.cache.find((section) => section.id === id);
  }

  getSectionById(id: string): CatalogSection {
    const section = this.findById(id);
    if (!section) {
      throw new NotFoundException('Section introuvable');
    }
    return section;
  }

  async findAll(): Promise<SectionResponseDto[]> {
    const rows = await this.sectionModel.findAll({
      order: [['id', 'ASC']],
    });
    return rows.map((row) => this.toResponse(row));
  }

  async findOne(id: string): Promise<SectionResponseDto> {
    return this.toResponse(await this.getSectionOrFail(id));
  }

  async create(dto: CreateSectionDto): Promise<SectionResponseDto> {
    const id = dto.id.trim();
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name est requis');
    }

    const existing = await this.sectionModel.findByPk(id);
    if (existing) {
      throw new ConflictException('Une section avec cet id existe déjà');
    }

    const section = await this.sectionModel.create({ id, name });
    await this.reloadCache();
    return this.toResponse(section);
  }

  async update(id: string, dto: UpdateSectionDto): Promise<SectionResponseDto> {
    const section = await this.getSectionOrFail(id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name est requis');
      }
      section.name = name;
    }
    await section.save();
    await this.reloadCache();
    return this.toResponse(section);
  }

  async remove(id: string): Promise<void> {
    const section = await this.getSectionOrFail(id);
    await section.destroy();
    await this.reloadCache();
  }

  async getAdminStats(): Promise<AdminStatsResponse> {
    const [totalItems, totalSections, totalUsers, totalAdmins] =
      await Promise.all([
        this.itemModel.count(),
        this.sectionModel.count(),
        this.userModel.count(),
        this.userModel.count({ where: { role: UserRoleEnum.ADMIN } }),
      ]);

    return { totalItems, totalSections, totalUsers, totalAdmins };
  }

  async getAdminSections(): Promise<AdminSectionSummary[]> {
    const rows = (await this.itemModel.findAll({
      attributes: ['section_id', [fn('COUNT', col('id')), 'itemCount']],
      group: ['section_id'],
      raw: true,
    })) as unknown as Array<{ section_id: string; itemCount: string | number }>;

    const itemCountBySectionId = new Map(
      rows.map((row) => [row.section_id, Number(row.itemCount)]),
    );

    return this.cache.map((section) => ({
      section_id: section.id,
      title: section.title,
      itemCount: itemCountBySectionId.get(section.id) ?? 0,
    }));
  }
}
