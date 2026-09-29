import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateQuestionDto {
  @ApiProperty({ example: 'Quelle est la capitale du Nord-Kivu ?' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    example: ['goma', 'bukavu', 'beni'],
    type: [String],
    description: 'Answer options',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  response: string[];

  @ApiProperty({
    example: 0,
    description: '0-based index of the correct option in response',
  })
  @IsInt()
  @Min(0)
  correct_answer: number;

  @ApiProperty({
    example: 30,
    description: 'Time limit in seconds',
  })
  @IsInt()
  @Min(1)
  time: number;

  @ApiProperty({
    example: 1,
    description: 'Parent level id from GET /levels',
  })
  @IsInt()
  @Min(1)
  level_id: number;

  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent modele id from GET /modele',
  })
  @IsUUID()
  modele_id: string;
}
