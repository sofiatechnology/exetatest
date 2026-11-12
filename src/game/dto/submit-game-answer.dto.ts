import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class SubmitGameAnswerDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  game_player_id: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' })
  @IsUUID()
  response_id: string;

  @ApiProperty({
    example: 2450,
    minimum: 0,
    description:
      'Client-measured answer time in milliseconds. The server also measures elapsed time and uses the slower measurement.',
  })
  @IsInt()
  @Min(0)
  @Max(2147483647)
  time_taken_ms: number;
}
