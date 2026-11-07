import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/sequelize';
import { Item, ItemTypeEnum } from '../models/item.model';
import { ItemCourse } from '../models/item-course.model';
import { ItemQuestion } from '../models/item-question.model';
import { SectionsService } from '../sections/sections.service';
import { ItemService } from './item.service';

describe('ItemService complete test', () => {
  let service: ItemService;

  const itemModel = {
    findOne: jest.fn(),
  };
  const sectionsService = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ItemService,
        { provide: getModelToken(Item), useValue: itemModel },
        { provide: getModelToken(ItemCourse), useValue: {} },
        { provide: SectionsService, useValue: sectionsService },
      ],
    }).compile();

    service = module.get<ItemService>(ItemService);
    jest.clearAllMocks();
    sectionsService.findById.mockReturnValue({ id: '01' });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns an ordered test with all categories and hides correct answers', async () => {
    const types = [
      ItemTypeEnum.CULTURE_GENERALE,
      ItemTypeEnum.SCIENCES,
      ItemTypeEnum.COURS_OPTIONS,
      ItemTypeEnum.LANGUES,
    ];

    for (const [index] of types.entries()) {
      itemModel.findOne.mockResolvedValueOnce({
        id: `item-${index}`,
        year: 2024,
        courses: [
          {
            id: `course-${index}`,
            course: `course ${index}`,
            passage: null,
            questions: [
              {
                id: `question-${index}`,
                question: `Question ${index}`,
                options: ['A', 'B'],
                answer: 0,
                createdAt: new Date('2024-06-07T12:00:00.000Z'),
              },
            ],
          },
        ],
      });
    }

    jest.spyOn(Math, 'random').mockReturnValue(0);

    const result = await service.getCompleteTest({
      section_id: '01',
      year: 2024,
    });

    expect(result.section_id).toBe('01');
    expect(result.categories.map(({ type }) => type)).toEqual(types);
    expect(
      result.categories.map(({ question_count }) => question_count),
    ).toEqual([1, 1, 1, 1]);
    expect(result.total_questions).toBe(4);
    expect(result.categories[0].courses[0].questions[0].options).toEqual([
      'B',
      'A',
    ]);
    expect(result.categories[0].courses[0].questions[0]).not.toHaveProperty(
      'answer',
    );
    expect(itemModel.findOne).toHaveBeenCalledTimes(4);
    expect(itemModel.findOne).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: {
          section_id: '01',
          type: ItemTypeEnum.CULTURE_GENERALE,
          year: 2024,
        },
        include: [
          {
            model: ItemCourse,
            required: true,
            include: [{ model: ItemQuestion, required: true }],
          },
        ],
      }),
    );
  });

  it('does not return a partial test when a category has no complete item', async () => {
    itemModel.findOne
      .mockResolvedValueOnce({ id: 'culture-item' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'options-item' })
      .mockResolvedValueOnce({ id: 'language-item' });

    await expect(service.getCompleteTest({ section_id: '01' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
