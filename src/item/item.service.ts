import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, Op, WhereOptions, fn, col } from 'sequelize';
import { Item, ItemTypeEnum } from '../models/item.model';
import { ItemCourse } from '../models/item-course.model';
import { ItemQuestion } from '../models/item-question.model';
import { AdminSectionItemsQueryDto } from './dto/admin-section-items-query.dto';
import { SectionsService } from '../sections/sections.service';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { ItemQueryDto } from './dto/item-query.dto';
import { ItemResponseDto } from './dto/item-response.dto';
import { CompleteTestQueryDto } from './dto/complete-test-query.dto';
import {
  CompleteTestCategoryDto,
  CompleteTestQuestionDto,
  CompleteTestResponseDto,
} from './dto/complete-test-response.dto';
import {
  RandomItemStatsFieldEnum,
  RandomItemStatsQueryDto,
} from './dto/random-item-stats-query.dto';

export type AdminItemSummary = {
  id: string;
  type: Item['type'];
  universal: boolean;
  year: number;
  courseCount: number;
};

const COMPLETE_TEST_CATEGORIES: Array<{
  type: ItemTypeEnum;
  label: string;
}> = [
  { type: ItemTypeEnum.CULTURE_GENERALE, label: 'Culture générale' },
  { type: ItemTypeEnum.SCIENCES, label: 'Sciences' },
  { type: ItemTypeEnum.COURS_OPTIONS, label: "Cours d'options" },
  { type: ItemTypeEnum.LANGUES, label: 'Langues' },
];

@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item)
    private readonly itemModel: typeof Item,
    @InjectModel(ItemCourse)
    private readonly itemCourseModel: typeof ItemCourse,
    private readonly sectionsService: SectionsService,
  ) {}

  private toResponse(item: Item): ItemResponseDto {
    return {
      id: item.id,
      type: item.type,
      section_id: item.section_id,
      year: item.year,
      universal: item.universal,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    };
  }

  private validateSectionId(sectionId: string): string {
    const trimmed = sectionId.trim();
    if (!trimmed) {
      throw new BadRequestException('section_id est requis');
    }
    if (!this.sectionsService.findById(trimmed)) {
      throw new BadRequestException('Section introuvable');
    }
    return trimmed;
  }

  private async getItemOrFail(id: string): Promise<Item> {
    const item = await this.itemModel.findByPk(id);
    if (!item) {
      throw new NotFoundException('Item introuvable');
    }
    return item;
  }

  private buildWhereClause(query: ItemQueryDto): WhereOptions<Item> {
    const where: WhereOptions<Item> = {};

    if (query.type !== undefined) {
      where.type = query.type;
    }
    if (query.section_id !== undefined) {
      where.section_id = query.section_id.trim();
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }
    if (query.universal !== undefined) {
      where.universal = query.universal;
    }

    return where;
  }

  async create(dto: CreateItemDto): Promise<ItemResponseDto> {
    const section_id = this.validateSectionId(dto.section_id);
    const item = await this.itemModel.create({
      type: dto.type,
      section_id,
      year: dto.year,
      universal: dto.universal ?? false,
    });
    return this.toResponse(item);
  }

  async findAll(query: ItemQueryDto): Promise<{
    data: ItemResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where = this.buildWhereClause(query);

    const options: FindOptions<Item> = {
      where,
      order: [
        ['year', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    };

    const { rows, count } = await this.itemModel.findAndCountAll(options);

    return {
      data: rows.map((item) => this.toResponse(item)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<ItemResponseDto> {
    const item = await this.getItemOrFail(id);
    return this.toResponse(item);
  }

  async findRandom(query: ItemQueryDto): Promise<ItemResponseDto> {
    const where = this.buildWhereClause(query);
    const item = await this.itemModel.findOne({
      where,
      order: [fn('RANDOM')],
    });

    if (!item) {
      throw new NotFoundException('No item found matching the criteria');
    }

    return this.toResponse(item);
  }

  async findRandomStats(
    query: RandomItemStatsQueryDto,
  ): Promise<Array<ItemResponseDto | Partial<ItemResponseDto>>> {
    const section_id = this.validateSectionId(query.section_id);
    const types = [
      ItemTypeEnum.SCIENCES,
      ItemTypeEnum.LANGUES,
      ItemTypeEnum.CULTURE_GENERALE,
      ItemTypeEnum.COURS_OPTIONS,
    ];

    const items = await Promise.all(
      types.map(async (type) => {
        const item = await this.itemModel.findOne({
          where: { section_id, type },
          order: [fn('RANDOM')],
        });
        if (!item) {
          return null;
        }

        const response = this.toResponse(item);
        if (!query.fields) {
          return response;
        }

        const selected: Partial<ItemResponseDto> = {};
        for (const field of query.fields) {
          switch (field) {
            case RandomItemStatsFieldEnum.ID:
              selected.id = response.id;
              break;
            case RandomItemStatsFieldEnum.TYPE:
              selected.type = response.type;
              break;
            case RandomItemStatsFieldEnum.SECTION_ID:
              selected.section_id = response.section_id;
              break;
            case RandomItemStatsFieldEnum.YEAR:
              selected.year = response.year;
              break;
            case RandomItemStatsFieldEnum.UNIVERSAL:
              selected.universal = response.universal;
              break;
            case RandomItemStatsFieldEnum.CREATED_AT:
              selected.created_at = response.created_at;
              break;
            case RandomItemStatsFieldEnum.UPDATED_AT:
              selected.updated_at = response.updated_at;
              break;
          }
        }
        return selected;
      }),
    );

    if (items.some((item) => item === null)) {
      throw new NotFoundException(
        'Unable to find one or more required item types for this section',
      );
    }

    return items.filter(
      (item): item is Exclude<typeof item, null> => item !== null,
    );
  }

  async getCompleteTest(
    query: CompleteTestQueryDto,
  ): Promise<CompleteTestResponseDto> {
    const section_id = this.validateSectionId(query.section_id);
    const categories = await Promise.all(
      COMPLETE_TEST_CATEGORIES.map(async ({ type, label }) => {
        const where: WhereOptions<Item> = { section_id, type };
        if (query.year !== undefined) {
          where.year = query.year;
        }

        const item = await this.itemModel.findOne({
          where,
          order: [fn('RANDOM')],
          include: [
            {
              model: ItemCourse,
              required: true,
              include: [{ model: ItemQuestion, required: true }],
            },
          ],
        });

        if (!item) {
          throw new NotFoundException(
            `No complete test item found for ${label}`,
          );
        }

        const courses = (item.courses ?? [])
          .slice()
          .sort((left, right) => left.course.localeCompare(right.course))
          .map((course) => ({
            id: course.id,
            course: course.course,
            passage: course.passage,
            questions: (course.questions ?? [])
              .slice()
              .sort(
                (left, right) =>
                  left.createdAt.getTime() - right.createdAt.getTime(),
              )
              .map((question) => this.toCompleteTestQuestion(question)),
          }));

        const category: CompleteTestCategoryDto = {
          type,
          label,
          item_id: item.id,
          year: item.year,
          question_count: courses.reduce(
            (total, course) => total + course.questions.length,
            0,
          ),
          courses,
        };
        return category;
      }),
    );

    return {
      section_id,
      categories,
      total_questions: categories.reduce(
        (total, category) => total + category.question_count,
        0,
      ),
    };
  }

  private toCompleteTestQuestion(
    question: ItemQuestion,
  ): CompleteTestQuestionDto {
    const options = question.options.slice();

    for (let index = options.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[randomIndex]] = [
        options[randomIndex],
        options[index],
      ];
    }

    return {
      id: question.id,
      question: question.question,
      options,
    };
  }

  async update(id: string, dto: UpdateItemDto): Promise<ItemResponseDto> {
    const item = await this.getItemOrFail(id);
    const updates: Partial<
      Pick<Item, 'type' | 'section_id' | 'year' | 'universal'>
    > = {};

    if (dto.type !== undefined) {
      updates.type = dto.type;
    }
    if (dto.section_id !== undefined) {
      updates.section_id = this.validateSectionId(dto.section_id);
    }
    if (dto.year !== undefined) {
      updates.year = dto.year;
    }
    if (dto.universal !== undefined) {
      updates.universal = dto.universal;
    }

    if (Object.keys(updates).length === 0) {
      throw new BadRequestException('Aucun champ à mettre à jour');
    }

    await item.update(updates);
    return this.toResponse(item);
  }

  private async getCourseCountsByItemIds(
    itemIds: string[],
  ): Promise<Map<string, number>> {
    if (itemIds.length === 0) {
      return new Map();
    }

    const rows = (await this.itemCourseModel.findAll({
      attributes: ['item_id', [fn('COUNT', col('id')), 'courseCount']],
      where: { item_id: { [Op.in]: itemIds } },
      group: ['item_id'],
      raw: true,
    })) as unknown as Array<{ item_id: string; courseCount: string | number }>;

    return new Map(rows.map((row) => [row.item_id, Number(row.courseCount)]));
  }

  async findBySectionAdmin(
    sectionId: string,
    query: AdminSectionItemsQueryDto,
  ): Promise<{
    items: AdminItemSummary[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Item> = { section_id: sectionId.trim() };

    if (query.universal !== undefined) {
      where.universal = query.universal;
    }
    if (query.year !== undefined) {
      where.year = query.year;
    }

    const { rows, count } = await this.itemModel.findAndCountAll({
      where,
      order: [
        ['year', 'DESC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
    });

    const courseCounts = await this.getCourseCountsByItemIds(
      rows.map((item) => item.id),
    );
    const total = count;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: rows.map((item) => ({
        id: item.id,
        type: item.type,
        universal: item.universal,
        year: item.year,
        courseCount: courseCounts.get(item.id) ?? 0,
      })),
      total,
      page,
      totalPages,
    };
  }
}
