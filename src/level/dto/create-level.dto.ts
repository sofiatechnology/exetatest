import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent course UUID from GET /courses',
  })
  @IsUUID()
  @IsNotEmpty()
  course_id: string;

  @ApiPropertyOptional({
    example: 'TEXTE 1 : PRO ARCHIA, §§1-4a',
    description: 'Level title (e.g. Latin text reference)',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example: 'Si quid est in me ingenii...',
    description: 'Reading passage for this level',
  })
  @IsOptional()
  @IsString()
  passage?: string;
}
