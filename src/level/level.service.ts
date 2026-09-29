import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { Course } from '../models/course.model';
import { Level } from '../models/level.model';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { LevelQueryDto } from './dto/level-query.dto';
import { LevelResponseDto } from './dto/level-response.dto';

@Injectable()
export class LevelService {
  constructor(
    @InjectModel(Level)
    private readonly levelModel: typeof Level,
    @InjectModel(Course)
    private readonly courseModel: typeof Course,
  ) {}

  private toResponse(level: Level): LevelResponseDto {
    return {
      id: level.id,
      course_id: level.course_id,
      title: level.title,
      passage: level.passage,
      created_at: level.createdAt,
      updated_at: level.updatedAt,
    };
  }

  private async ensureCourseExists(courseId: string): Promise<void> {
    const course = await this.courseModel.findByPk(courseId);
    if (!course) {
      throw new BadRequestException('Cours introuvable');
    }
  }

  private async getCourseOrFail(courseId: string): Promise<Course> {
    const course = await this.courseModel.findByPk(courseId);
    if (!course) {
      throw new NotFoundException('Cours introuvable');
    }
    return course;
  }

  private async getLevelOrFail(id: number): Promise<Level> {
    const level = await this.levelModel.findByPk(id);
    if (!level) {
      throw new NotFoundException('Niveau introuvable');
    }
    return level;
  }

  async create(dto: CreateLevelDto): Promise<LevelResponseDto> {
    await this.ensureCourseExists(dto.course_id);
    const level = await this.levelModel.create({
      course_id: dto.course_id,
      title: dto.title?.trim() || null,
      passage: dto.passage?.trim() || null,
    });
    return this.toResponse(level);
  }

  async findAll(query: LevelQueryDto): Promise<{
    data: LevelResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Level> = {};
    if (query.course_id !== undefined) {
      where.course_id = query.course_id;
    }

    const options: FindOptions<Level> = {
      where,
      order: [['id', 'ASC']],
      limit,
      offset,
    };

    const { rows, count } = await this.levelModel.findAndCountAll(options);
    return {
      data: rows.map((row) => this.toResponse(row)),
      total: count,
      page,
      limit,
    };
  }

  /**
   * Used after the client selects a course (GET /levels/course/:courseId).
   * Returns 404 if the course does not exist.
   */
  async findByCourseId(
    courseId: string,
    query: LevelQueryDto,
  ): Promise<{
    data: LevelResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    await this.getCourseOrFail(courseId);
    return this.findAll({ ...query, course_id: courseId });
  }

  async findOne(id: number): Promise<LevelResponseDto> {
    return this.toResponse(await this.getLevelOrFail(id));
  }

  async update(id: number, dto: UpdateLevelDto): Promise<LevelResponseDto> {
    const level = await this.getLevelOrFail(id);
    if (dto.course_id !== undefined) {
      await this.ensureCourseExists(dto.course_id);
      level.course_id = dto.course_id;
    }
    if (dto.title !== undefined) {
      level.title = dto.title === null ? null : dto.title.trim() || null;
    }
    if (dto.passage !== undefined) {
      level.passage = dto.passage === null ? null : dto.passage.trim() || null;
    }
    await level.save();
    return this.toResponse(level);
  }

  async remove(id: number): Promise<void> {
    const level = await this.getLevelOrFail(id);
    await level.destroy();
  }
}
