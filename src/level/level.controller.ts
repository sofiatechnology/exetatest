import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { LevelService } from './level.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { UpdateLevelDto } from './dto/update-level.dto';
import { LevelQueryDto } from './dto/level-query.dto';
import { LevelResponseDto } from './dto/level-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('levels')
@Controller('levels')
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Create a level (admin only)' })
  @ApiBody({ type: CreateLevelDto })
  @ApiCreatedResponse({
    description: 'Level created successfully',
    type: LevelResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() dto: CreateLevelDto) {
    return this.levelService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List levels',
    description:
      'Public. Optional filter: course_id. Use GET /levels/course/{courseId} to filter by course in the path.',
  })
  @ApiOkResponse({
    description: 'Levels returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/LevelResponseDto' },
        },
        total: { type: 'number', example: 10 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  findAll(@Query() query: LevelQueryDto) {
    return this.levelService.findAll(query);
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'List levels for a course',
    description: 'Public. Results are paginated; page and limit are optional.',
  })
  @ApiParam({
    name: 'courseId',
    description: 'UUID of the course',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @ApiOkResponse({
    description: 'Levels for the course returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/LevelResponseDto' },
        },
        total: { type: 'number', example: 10 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  findByCourse(
    @Param('courseId') courseId: string,
    @Query() query: LevelQueryDto,
  ) {
    return this.levelService.findAll({ ...query, course_id: courseId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one level by id' })
  @ApiOkResponse({
    description: 'Level returned successfully',
    type: LevelResponseDto,
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.levelService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Update a level (admin only)' })
  @ApiBody({ type: UpdateLevelDto })
  @ApiOkResponse({
    description: 'Level updated successfully',
    type: LevelResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLevelDto) {
    return this.levelService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({ summary: 'Delete a level (admin only)' })
  @ApiNoContentResponse({ description: 'Level deleted' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.levelService.remove(id);
  }
}
