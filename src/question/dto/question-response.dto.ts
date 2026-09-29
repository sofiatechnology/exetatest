import { ApiProperty } from '@nestjs/swagger';

export class QuestionResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Quelle est la capitale du Nord-Kivu ?' })
  text: string;

  @ApiProperty({
    example: ['goma', 'bukavu', 'beni'],
    type: [String],
  })
  response: string[];

  @ApiProperty({ example: 0 })
  correct_answer: number;

  @ApiProperty({ example: 30 })
  time: number;

  @ApiProperty({ example: 1 })
  level_id: number;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  modele_id: string;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
