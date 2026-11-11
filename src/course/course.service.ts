import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { Course } from '../models/course.model';
import { Level } from '../models/level.model';
import { Section } from '../models/section.model';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';

export interface CourseListResponse {
  data: CourseResponseDto[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class CourseService {
  constructor(
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
    @InjectModel(Section)
    private readonly sectionModel: typeof Section,
  ) {}

  private toResponse(course: Course): CourseResponseDto {
    return {
      id: course.id,
      name: course.name,
      section_id: course.section_id,
      item_id: course.item_id,
      title: course.title,
      passage: course.passage,
      created_at: course.createdAt,
      updated_at: course.updatedAt,
      levels: course.levels?.map((level) => ({
        id: level.id,
        course_id: level.course_id,
        title: level.title,
        passage: level.passage,
        created_at: level.createdAt,
        updated_at: level.updatedAt,
      })),
    };
  }

  private async ensureSectionExists(sectionId: string): Promise<void> {
    const section = await this.sectionModel.findByPk(sectionId);
    if (!section) {
      throw new BadRequestException('Section introuvable');
    }
  }

  private async getCourseOrFail(id: string): Promise<Course> {
    const course = await this.courseModel.findByPk(id);
    if (!course) {
      throw new NotFoundException('Cours introuvable');
    }
    return course;
  }

  async create(dto: CreateCourseDto): Promise<CourseResponseDto> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('name est requis');
    }
    const section_id = dto.section_id.trim();
    await this.ensureSectionExists(section_id);
    const course = await this.courseModel.create({ name, section_id });
    return this.toResponse(course);
  }

  async findAll(query: CourseQueryDto): Promise<CourseListResponse> {
    return this.list(query, false);
  }

  async findBySection(
    sectionId: string,
    query: CourseQueryDto,
  ): Promise<CourseListResponse> {
    return this.list({ ...query, section_id: sectionId }, true);
  }

  private async list(
    query: CourseQueryDto,
    requireLevels: boolean,
  ): Promise<CourseListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Course> = {};
    if (query.section_id !== undefined) {
      where.section_id = query.section_id.trim();
    }

    const options: FindOptions<Course> = {
      where,
      order: [
        ['name', 'ASC'],
        ['createdAt', 'DESC'],
      ],
      limit,
      offset,
      ...(requireLevels && {
        include: [{ model: Level, required: true }],
        distinct: true,
      }),
    };

    const { rows, count } = await this.courseModel.findAndCountAll(options);
    return {
      data: rows.map((row) => this.toResponse(row)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<CourseResponseDto> {
    return this.toResponse(await this.getCourseOrFail(id));
  }

  async update(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const course = await this.getCourseOrFail(id);
    if (dto.name !== undefined) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('name est requis');
      }
      course.name = name;
    }
    if (dto.section_id !== undefined) {
      const section_id = dto.section_id.trim();
      await this.ensureSectionExists(section_id);
      course.section_id = section_id;
    }
    await course.save();
    return this.toResponse(course);
  }

  async remove(id: string): Promise<void> {
    const course = await this.getCourseOrFail(id);
    await course.destroy();
  }
}
