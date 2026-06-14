import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserAuthResponseDto {
  @ApiProperty({ format: 'email', example: 'student@example.com' })
  email: string;

  @ApiProperty({ type: 'boolean' })
  hasSelectedSections: boolean;

  @ApiProperty({ type: 'number', example: 4 })
  current_streak: number;

  @ApiProperty({ type: 'number', example: 9 })
  longest_streak: number;

  @ApiPropertyOptional({ example: 'CD', nullable: true })
  country?: string | null;

  @ApiPropertyOptional({ example: 'GOMA', nullable: true })
  region?: string | null;

  @ApiPropertyOptional({ example: 'LATIN-PHILO', nullable: true })
  section?: string | null;

  @ApiPropertyOptional({ example: '01', nullable: true })
  section_id?: string | null;
}
