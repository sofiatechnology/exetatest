import {
  Body,
  Controller,
  Get,
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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ItemQuestionService } from './item-question.service';
import { CreateItemQuestionDto } from './dto/create-item-question.dto';
import { UpdateItemQuestionDto } from './dto/update-item-question.dto';
import { ItemQuestionResponseDto } from './dto/item-question-response.dto';
import { ItemQuestionQueryDto } from './dto/item-question-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRoleEnum } from '../models/user.model';

@ApiTags('item-questions')
@Controller('item-questions')
export class ItemQuestionController {
  constructor(private readonly itemQuestionService: ItemQuestionService) {}

  @Post()
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Create an item question (admin only)',
    description:
      'Creates a multiple-choice question linked to an item course. Requires admin role.',
  })
  @ApiBody({ type: CreateItemQuestionDto })
  @ApiCreatedResponse({
    description: 'Item question created successfully',
    type: ItemQuestionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  create(@Body() createItemQuestionDto: CreateItemQuestionDto) {
    return this.itemQuestionService.create(createItemQuestionDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List item questions',
    description:
      'Public. Returns paginated quiz questions with options randomized per response. Optional filter: item_course_id.',
  })
  @ApiOkResponse({
    description: 'Item questions returned successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ItemQuestionResponseDto' },
        },
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
      },
    },
  })
  findAll(@Query() query: ItemQuestionQueryDto) {
    return this.itemQuestionService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one item question by id',
    description:
      'Public. Returns a quiz question with options randomized and answer remapped to the new 0-based index.',
  })
  @ApiOkResponse({
    description: 'Item question returned successfully',
    type: ItemQuestionResponseDto,
  })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.itemQuestionService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  @ApiOperation({
    summary: 'Update an item question (admin only)',
    description: 'Partial update. Send only fields to change.',
  })
  @ApiBody({ type: UpdateItemQuestionDto })
  @ApiOkResponse({
    description: 'Item question updated successfully',
    type: ItemQuestionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Admin role required' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateItemQuestionDto: UpdateItemQuestionDto,
  ) {
    return this.itemQuestionService.update(id, updateItemQuestionDto);
  }
}
