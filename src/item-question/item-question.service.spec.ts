import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { ItemCourse } from '../models/item-course.model';
import { ItemQuestion } from '../models/item-question.model';
import { ItemQuestionService } from './item-question.service';

describe('ItemQuestionService', () => {
  let service: ItemQuestionService;

  const itemQuestionModel = {
    findByPk: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemQuestionService,
        {
          provide: getModelToken(ItemQuestion),
          useValue: itemQuestionModel,
        },
        {
          provide: getModelToken(ItemCourse),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ItemQuestionService>(ItemQuestionService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shuffles options and remaps the correct answer index', async () => {
    itemQuestionModel.findByPk.mockResolvedValue({
      id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      question: 'Question',
      item_course_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
      options: ['A', 'B', 'C', 'D'],
      answer: 2,
      createdAt: new Date('2024-06-07T12:00:00.000Z'),
      updatedAt: new Date('2024-06-07T12:00:00.000Z'),
    });
    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await service.findOne(
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    );

    expect(result.options).toEqual(['B', 'C', 'D', 'A']);
    expect(result.answer).toBe(1);
    expect(result.options[result.answer]).toBe('C');
  });
});
