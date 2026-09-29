import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { fn, col } from 'sequelize';
import { Item } from '../models/item.model';
import { Section } from '../models/section.model';
import { User, UserRoleEnum } from '../models/user.model';

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

  private async reloadCache(): Promise<void> {
    const rows = await this.sectionModel.findAll({
      order: [['id', 'ASC']],
    });
    this.cache = rows.map((row) => this.toCatalogSection(row));
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
