import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class UpdateLevelDto {
  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent course UUID',
  })
  @IsOptional()
  @IsUUID()
  course_id?: string;

  @ApiPropertyOptional({
    example: 'TEXTE 1 : PRO ARCHIA, §§1-4a',
  })
  @IsOptional()
  @IsString()
  title?: string | null;

  @ApiPropertyOptional({
    example: 'Si quid est in me ingenii...',
  })
  @IsOptional()
  @IsString()
  passage?: string | null;
}
