import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ModeleService } from './modele.service';
import { CreateModeleDto } from './dto/create-modele.dto';
import { UpdateModeleDto } from './dto/update-modele.dto';
import { ModeleQueryDto } from './dto/modele-query.dto';
import { ModeleResponseDto } from './dto/modele-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('modele')
@Controller('modele')
export class ModeleController {
  constructor(private readonly modeleService: ModeleService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a modele (admin only)' })
  @ApiBody({ type: CreateModeleDto })
  @ApiCreatedResponse({
    description: 'Modele created successfully',
    type: ModeleResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() dto: CreateModeleDto) {
    return this.modeleService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List modele records',
    description: 'Public. Optional filters: is_public, pin.',
  })
  @ApiOkResponse({
    description: 'Modele list returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ModeleResponseDto' },
        },
        total: { type: 'number', example: 5 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  findAll(@Query() query: ModeleQueryDto) {
    return this.modeleService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one modele by id' })
  @ApiOkResponse({
    description: 'Modele returned successfully',
    type: ModeleResponseDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.modeleService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update a modele (admin only)' })
  @ApiBody({ type: UpdateModeleDto })
  @ApiOkResponse({
    description: 'Modele updated successfully',
    type: ModeleResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateModeleDto) {
    return this.modeleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete a modele (admin only)' })
  @ApiNoContentResponse({ description: 'Modele deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.modeleService.remove(id);
  }
}
