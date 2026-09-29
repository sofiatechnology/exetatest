import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class UpdateQuestionDto {
  @ApiPropertyOptional({ example: 'Quelle est la capitale du Nord-Kivu ?' })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    example: ['goma', 'bukavu', 'beni'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  response?: string[];

  @ApiPropertyOptional({
    example: 0,
    description: '0-based index of the correct option in response',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  correct_answer?: number;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsInt()
  @Min(1)
  time?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  level_id?: number;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID()
  modele_id?: string;
}
