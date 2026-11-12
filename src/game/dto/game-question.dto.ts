import { ApiProperty } from '@nestjs/swagger';

export class GameOptionDto {
  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  id: string;

  @ApiProperty({ example: 'Goma' })
  option_text: string;
}

export class GameQuestionDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  question_id: string;

  @ApiProperty({ example: 'What is the capital of North Kivu?' })
  question: string;

  @ApiProperty({ example: 1, description: '1-based question index.' })
  question_index: number;

  @ApiProperty({ example: 20 })
  question_count: number;

  @ApiProperty({
    example: 30,
    description: 'Time allowed to answer, in seconds.',
  })
  time_limit_seconds: number;

  @ApiProperty({ type: [GameOptionDto] })
  options: GameOptionDto[];

  @ApiProperty({ example: '2026-11-12T08:15:00.000Z' })
  opened_at: Date;
}
