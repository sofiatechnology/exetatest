import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export enum RandomItemStatsFieldEnum {
  ID = 'id',
  TYPE = 'type',
  SECTION_ID = 'section_id',
  YEAR = 'year',
  UNIVERSAL = 'universal',
  CREATED_AT = 'created_at',
  UPDATED_AT = 'updated_at',
}

export class RandomItemStatsQueryDto {
  @ApiProperty({
    example: '01',
    description: 'Section identifier used to select items',
  })
  @IsString()
  @IsNotEmpty()
  section_id: string;

  @ApiPropertyOptional({
    enum: RandomItemStatsFieldEnum,
    isArray: true,
    example: ['id', 'type', 'year'],
    description: 'Comma-separated response fields to include',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string'
      ? value.split(',').map((field) => field.trim())
      : value,
  )
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(RandomItemStatsFieldEnum, { each: true })
  fields?: RandomItemStatsFieldEnum[];
}
