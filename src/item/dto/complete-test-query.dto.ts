import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CompleteTestQueryDto {
  @ApiProperty({
    example: '01',
    description: 'Section identifier used to select the complete test.',
  })
  @IsString()
  @IsNotEmpty()
  section_id: string;

  @ApiPropertyOptional({
    example: 2024,
    minimum: 1900,
    maximum: 2100,
    description:
      'Optional exam year. When omitted, an available year is selected randomly for each category.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  @Max(2100)
  year?: number;
}
