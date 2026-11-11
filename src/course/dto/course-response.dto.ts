import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LevelResponseDto } from '../../level/dto/level-response.dto';

export class CourseResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Mathématiques' })
  name: string;

  @ApiProperty({ example: '02', nullable: true })
  section_id: string | null;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    nullable: true,
  })
  item_id: string | null;

  @ApiProperty({ example: 'Mathématiques', nullable: true })
  title: string | null;

  @ApiProperty({ example: 'Texte de passage', nullable: true })
  passage: string | null;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;

  @ApiPropertyOptional({ type: () => [LevelResponseDto] })
  levels?: LevelResponseDto[];
}
