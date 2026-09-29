import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSectionDto {
  @ApiProperty({ example: '01', description: 'Section catalog id' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id: string;

  @ApiProperty({ example: 'LATIN – PHILO' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
