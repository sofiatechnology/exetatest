import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateSectionDto {
  @ApiPropertyOptional({ example: 'LATIN – PHILO' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
