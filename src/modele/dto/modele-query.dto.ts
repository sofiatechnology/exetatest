import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ModeleQueryDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Filter by public flag',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter by pin flag',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pin?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
