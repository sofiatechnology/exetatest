import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({
    example: 'Quelle est la capitale du Nord-Kivu ?',
    nullable: true,
  })
  text: string | null;

  @ApiProperty({
    example: 'Quelle est la capitale du Nord-Kivu ?',
    nullable: true,
  })
  question: string | null;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
  })
  course_id: string | null;

  @ApiProperty({
    example: ['goma', 'bukavu', 'beni'],
    type: [String],
    nullable: true,
  })
  response: string[] | null;

  @ApiProperty({ example: 0, nullable: true })
  correct_answer: number | null;

  @ApiProperty({ example: 30, nullable: true })
  time: number | null;

  @ApiProperty({ example: 30, nullable: true })
  time_limit: number | null;

  @ApiProperty({ example: 1, nullable: true })
  level_id: number | null;

  @ApiProperty({
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    nullable: true,
  })
  modele_id: string | null;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
