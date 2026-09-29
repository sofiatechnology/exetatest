import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({ example: 'Mathématiques' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '02',
    description: 'Parent section id from GET /sections',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  section_id: string;
}
