import { ApiProperty } from '@nestjs/swagger';

export class ModeleResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Quiz rapide' })
  title: string;

  @ApiProperty({ example: false })
  pin: boolean;

  @ApiProperty({ example: false })
  auto_scroll: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the modele is public (DB column: public)',
  })
  is_public: boolean;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  created_at: Date;

  @ApiProperty({ example: '2024-06-07T12:00:00.000Z' })
  updated_at: Date;
}
