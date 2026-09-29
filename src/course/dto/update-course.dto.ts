import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCourseDto {
  @ApiPropertyOptional({ example: 'Mathématiques' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: '02',
    description: 'Parent section id',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  section_id?: string;
}
