import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateModeleDto {
  @ApiProperty({ example: 'Quiz rapide' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: false, default: false })
  @IsOptional()
  @IsBoolean()
  pin?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Enable auto-scroll',
  })
  @IsOptional()
  @IsBoolean()
  auto_scroll?: boolean;

  @ApiPropertyOptional({
    example: true,
    default: false,
    description: 'Whether the modele is public (DB column: public)',
  })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
