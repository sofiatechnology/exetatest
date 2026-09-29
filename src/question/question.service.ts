import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FindOptions, WhereOptions } from 'sequelize';
import { Level } from '../models/level.model';
import { Modele } from '../models/modele.model';
import { Question } from '../models/question.model';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionQueryDto } from './dto/question-query.dto';
import { QuestionResponseDto } from './dto/question-response.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(Level)
    private readonly levelModel: typeof Level,
    @InjectModel(Modele)
    private readonly modeleModel: typeof Modele,
  ) {}

  private toResponse(question: Question): QuestionResponseDto {
    return {
      id: question.id,
      text: question.text,
      response: question.response,
      correct_answer: question.correct_answer,
      time: question.time,
      level_id: question.level_id,
      modele_id: question.modele_id,
      created_at: question.createdAt,
      updated_at: question.updatedAt,
    };
  }

  private normalizeResponse(response: string[]): string[] {
    const normalized = response.map((item) => item.trim()).filter(Boolean);
    if (normalized.length === 0) {
      throw new BadRequestException(
        'response doit contenir au moins une option',
      );
    }
    return normalized;
  }

  private validateCorrectAnswer(
    correctAnswer: number,
    response: string[],
  ): void {
    if (correctAnswer < 0 || correctAnswer >= response.length) {
      throw new BadRequestException(
        'correct_answer doit être un index valide dans response',
      );
    }
  }

  private async ensureLevelExists(levelId: number): Promise<void> {
    const level = await this.levelModel.findByPk(levelId);
    if (!level) {
      throw new BadRequestException('Niveau introuvable');
    }
  }

  private async ensureModeleExists(modeleId: string): Promise<void> {
    const modele = await this.modeleModel.findByPk(modeleId);
    if (!modele) {
      throw new BadRequestException('Modele introuvable');
    }
  }

  private async getQuestionOrFail(id: string): Promise<Question> {
    const question = await this.questionModel.findByPk(id);
    if (!question) {
      throw new NotFoundException('Question introuvable');
    }
    return question;
  }

  async create(dto: CreateQuestionDto): Promise<QuestionResponseDto> {
    const text = dto.text.trim();
    if (!text) {
      throw new BadRequestException('text est requis');
    }
    const response = this.normalizeResponse(dto.response);
    this.validateCorrectAnswer(dto.correct_answer, response);
    await this.ensureLevelExists(dto.level_id);
    await this.ensureModeleExists(dto.modele_id);

    const question = await this.questionModel.create({
      text,
      response,
      correct_answer: dto.correct_answer,
      time: dto.time,
      level_id: dto.level_id,
      modele_id: dto.modele_id,
    });
    return this.toResponse(question);
  }

  async findAll(query: QuestionQueryDto): Promise<{
    data: QuestionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const offset = (page - 1) * limit;
    const where: WhereOptions<Question> = {};
    if (query.level_id !== undefined) {
      where.level_id = query.level_id;
    }
    if (query.modele_id !== undefined) {
      where.modele_id = query.modele_id;
    }

    const options: FindOptions<Question> = {
      where,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    };

    const { rows, count } = await this.questionModel.findAndCountAll(options);
    return {
      data: rows.map((row) => this.toResponse(row)),
      total: count,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<QuestionResponseDto> {
    return this.toResponse(await this.getQuestionOrFail(id));
  }

  async update(
    id: string,
    dto: UpdateQuestionDto,
  ): Promise<QuestionResponseDto> {
    const question = await this.getQuestionOrFail(id);

    if (dto.text !== undefined) {
      const text = dto.text.trim();
      if (!text) {
        throw new BadRequestException('text est requis');
      }
      question.text = text;
    }

    if (dto.response !== undefined) {
      question.response = this.normalizeResponse(dto.response);
    }

    if (dto.correct_answer !== undefined) {
      question.correct_answer = dto.correct_answer;
    }

    this.validateCorrectAnswer(question.correct_answer, question.response);

    if (dto.time !== undefined) {
      question.time = dto.time;
    }

    if (dto.level_id !== undefined) {
      await this.ensureLevelExists(dto.level_id);
      question.level_id = dto.level_id;
    }

    if (dto.modele_id !== undefined) {
      await this.ensureModeleExists(dto.modele_id);
      question.modele_id = dto.modele_id;
    }

    await question.save();
    return this.toResponse(question);
  }

  async remove(id: string): Promise<void> {
    const question = await this.getQuestionOrFail(id);
    await question.destroy();
  }
}
