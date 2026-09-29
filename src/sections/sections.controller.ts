import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
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
import { SectionsService } from './sections.service';
import { SectionResponseDto } from './dto/section-response.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('sections')
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @ApiOperation({
    summary: 'List sections',
    description: 'Public. Returns all sections from the sections table.',
  })
  @ApiOkResponse({
    description: 'Sections returned successfully',
    type: [SectionResponseDto],
  })
  findAll() {
    return this.sectionsService.findAll();
  }

  @Get('count')
  @ApiOperation({
    summary: 'Get section count',
    description: 'Returns how many sections exist.',
  })
  @ApiOkResponse({
    description: 'Returns total number of sections',
    schema: {
      type: 'object',
      properties: {
        count: { type: 'number', example: 18 },
      },
    },
  })
  getSectionCount() {
    return { count: this.sectionsService.getSectionCount() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one section by id' })
  @ApiOkResponse({
    description: 'Section returned successfully',
    type: SectionResponseDto,
  })
  findOne(@Param('id') id: string) {
    return this.sectionsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a section (admin only)' })
  @ApiBody({ type: CreateSectionDto })
  @ApiCreatedResponse({
    description: 'Section created successfully',
    type: SectionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() dto: CreateSectionDto) {
    return this.sectionsService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update a section (admin only)' })
  @ApiBody({ type: UpdateSectionDto })
  @ApiOkResponse({
    description: 'Section updated successfully',
    type: SectionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.sectionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete a section (admin only)' })
  @ApiNoContentResponse({ description: 'Section deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async remove(@Param('id') id: string) {
    await this.sectionsService.remove(id);
  }
}
