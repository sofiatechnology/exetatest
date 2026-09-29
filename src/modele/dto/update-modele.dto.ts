import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateModeleDto {
  @ApiPropertyOptional({ example: 'Quiz rapide' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  pin?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  auto_scroll?: boolean;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the modele is public (DB column: public)',
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
