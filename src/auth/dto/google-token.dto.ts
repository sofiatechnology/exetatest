import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class GoogleTokenDto {
  @ApiProperty({ description: 'Authorization code returned by Google.' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({
    description: 'PKCE verifier that matches the challenge sent to /authorize.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._~-]{43,128}$/)
  code_verifier?: string;

  @ApiPropertyOptional({
    description:
      'Ignored. The backend always uses GOOGLE_REDIRECT_URI for the Google code exchange.',
  })
  @IsOptional()
  @IsString()
  redirect_uri?: string;

  @ApiProperty({ enum: ['mobile', 'web'] })
  @IsIn(['mobile', 'web'])
  platform: 'mobile' | 'web';
}
