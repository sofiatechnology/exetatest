import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateLevelDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Parent course UUID from GET /courses',
  })
  @IsUUID()
  @IsNotEmpty()
  course_id: string;
}
