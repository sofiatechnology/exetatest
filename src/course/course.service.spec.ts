import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Course } from '../models/course.model';
import { Level } from '../models/level.model';
import { Section } from '../models/section.model';
import { CourseService } from './course.service';

describe('CourseService', () => {
  let service: CourseService;

  const courseModel = {
    findAndCountAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: getModelToken(Course), useValue: courseModel },
        { provide: getModelToken(Section), useValue: {} },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
    jest.clearAllMocks();
  });

  it('returns section courses with levels and excludes courses without levels', async () => {
    const createdAt = new Date('2024-06-07T12:00:00.000Z');
    const updatedAt = new Date('2024-06-08T12:00:00.000Z');
    courseModel.findAndCountAll.mockResolvedValue({
      rows: [
        {
          id: 'course-id',
          name: 'Mathématiques',
          section_id: '01',
          createdAt,
          updatedAt,
          levels: [
            {
              id: 1,
              course_id: 'course-id',
              title: 'Niveau 1',
              passage: null,
              createdAt,
              updatedAt,
            },
          ],
        },
      ],
      count: 1,
    });

    const result = await service.findBySection('01', { page: 1, limit: 100 });

    expect(courseModel.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { section_id: '01' },
        limit: 100,
        offset: 0,
        include: [{ model: Level, required: true }],
        distinct: true,
      }),
    );
    expect(result.data[0].levels).toEqual([
      {
        id: 1,
        course_id: 'course-id',
        title: 'Niveau 1',
        passage: null,
        created_at: createdAt,
        updated_at: updatedAt,
      },
    ]);
  });
});
