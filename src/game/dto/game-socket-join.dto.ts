import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class GameSocketJoinDto {
  @ApiProperty({ example: '482731' })
  @IsString()
  @Matches(/^\d{6}$/)
  pin_code: string;

  @ApiPropertyOptional({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Player ID returned by POST /api/games/join. Omit for host.',
  })
  @IsOptional()
  @IsUUID()
  player_id?: string;
}
