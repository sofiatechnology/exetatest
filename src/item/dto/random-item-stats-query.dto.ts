import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RandomItemStatsQueryDto {
  @ApiProperty({ example: '01', description: 'Section identifier used to select items' })
  @IsString()
  @IsNotEmpty()
  section_id: string;
}
