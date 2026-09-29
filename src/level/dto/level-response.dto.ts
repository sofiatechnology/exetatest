import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LevelResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  course_id: string;

  @ApiPropertyOptional({
    example: 'TEXTE 1 : PRO ARCHIA, §§1-4a',
    nullable: true,
  })
  title: string | null;

  @ApiPropertyOptional({
    example: 'Si quid est in me ingenii...',
    nullable: true,
  })
  passage: string | null;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
