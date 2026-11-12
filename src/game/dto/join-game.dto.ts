import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class JoinGameDto {
  @ApiProperty({ example: '482731' })
  @IsString()
  @Matches(/^\d{6}$/)
  pin_code: string;

  @ApiProperty({ example: 'Birusha' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nickname: string;
}
