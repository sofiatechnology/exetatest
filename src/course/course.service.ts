import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { Course } from '../models/course.model';
import { Section } from '../models/section.model';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseQueryDto } from './dto/course-query.dto';
import { CourseResponseDto } from './dto/course-response.dto';

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
      created_at: course.createdAt,
      updated_at: course.updatedAt,
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

  async findAll(query: CourseQueryDto): Promise<{
    data: CourseResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
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
