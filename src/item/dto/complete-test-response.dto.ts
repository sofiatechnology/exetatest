import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ItemTypeEnum } from '../../models/item.model';

export class CompleteTestQuestionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Quelle est la capitale du Nord-Kivu ?' })
  question: string;

  @ApiProperty({
    example: ['goma', 'bukavu'],
    type: [String],
    description:
      'Answer choices in randomized order; the correct answer is not included.',
  })
  options: string[];
}

export class CompleteTestCourseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'chimie' })
  course: string;

  @ApiPropertyOptional({
    example: 'Le passage de lecture associé à ce cours…',
    nullable: true,
  })
  passage: string | null;

  @ApiProperty({ type: [CompleteTestQuestionDto] })
  questions: CompleteTestQuestionDto[];
}

export class CompleteTestCategoryDto {
  @ApiProperty({ enum: ItemTypeEnum, example: ItemTypeEnum.CULTURE_GENERALE })
  type: ItemTypeEnum;

  @ApiProperty({ example: 'Culture générale' })
  label: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  item_id: string;

  @ApiProperty({ example: 2024 })
  year: number;

  @ApiProperty({ example: 12 })
  question_count: number;

  @ApiProperty({ type: [CompleteTestCourseDto] })
  courses: CompleteTestCourseDto[];
}

export class CompleteTestResponseDto {
  @ApiProperty({ example: '01' })
  section_id: string;

  @ApiProperty({
    type: [CompleteTestCategoryDto],
    description:
      'Categories are returned in this order: culture générale, sciences, cours d’options, langues.',
  })
  categories: CompleteTestCategoryDto[];

  @ApiProperty({ example: 48 })
  total_questions: number;
}
