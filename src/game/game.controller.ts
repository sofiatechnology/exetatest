import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateGameDto } from './dto/create-game.dto';
import {
  GameAdvanceResponseDto,
  GameAnswerResultDto,
  GameLeaderboardDto,
  GameResponseDto,
  JoinGameResponseDto,
} from './dto/game-response.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { SubmitGameAnswerDto } from './dto/submit-game-answer.dto';
import { GameService } from './game.service';

@ApiTags('games')
@Controller('games')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a live game (host only)',
    description:
      'Creates a waiting game and returns its six-digit PIN. The host must own the revision or the revision must be public.',
  })
  @ApiBody({ type: CreateGameDto })
  @ApiCreatedResponse({ type: GameResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({
    description: 'Revision is private and belongs to another user',
  })
  @ApiNotFoundResponse({ description: 'Revision not found' })
  createGame(@CurrentUser() user: { id: string }, @Body() dto: CreateGameDto) {
    return this.gameService.createGame(user.id, dto);
  }

  @Post('join')
  @ApiOperation({
    summary: 'Join a live game with its PIN',
    description:
      'Public endpoint for players. Joining is allowed only before the host starts the game. Save player_id for answering and for joining the Socket.IO room.',
  })
  @ApiBody({ type: JoinGameDto })
  @ApiCreatedResponse({ type: JoinGameResponseDto })
  @ApiNotFoundResponse({ description: 'Waiting game not found' })
  joinGame(@Body() dto: JoinGameDto) {
    return this.gameService.joinGame(dto);
  }

  @Get(':gameSessionId')
  @ApiOperation({
    summary: 'Get live game state',
    description:
      'Returns the lobby/game state and current public question. Correctness flags and answer keys are never returned.',
  })
  @ApiOkResponse({ type: GameResponseDto })
  @ApiNotFoundResponse({ description: 'Game not found' })
  getGame(@Param('gameSessionId', ParseUUIDPipe) gameSessionId: string) {
    return this.gameService.getGame(gameSessionId);
  }

  @Post(':gameSessionId/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Start the game and publish question 1',
    description:
      'Host-only. Sets current_question_index to 1 and broadcasts game:started and game:question to the Socket.IO room.',
  })
  @ApiOkResponse({ type: GameAdvanceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Only the host can start the game' })
  @ApiConflictResponse({ description: 'Game has already started or ended' })
  startGame(
    @Param('gameSessionId', ParseUUIDPipe) gameSessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.gameService.startGame(gameSessionId, user.id);
  }

  @Post(':gameSessionId/next-question')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Advance to the next question',
    description:
      'Host-only. Broadcasts game:question. Once all questions are complete, marks the session ended and broadcasts game:ended.',
  })
  @ApiOkResponse({ type: GameAdvanceResponseDto })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Only the host can advance questions' })
  @ApiConflictResponse({ description: 'Game is not active' })
  nextQuestion(
    @Param('gameSessionId', ParseUUIDPipe) gameSessionId: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.gameService.nextQuestion(gameSessionId, user.id);
  }

  @Post(':gameSessionId/answers')
  @ApiOperation({
    summary: 'Submit a player answer',
    description:
      'Public player endpoint. The server verifies the active question and response, measures elapsed time, stores correctness privately, scores the answer, and broadcasts an updated leaderboard.',
  })
  @ApiBody({ type: SubmitGameAnswerDto })
  @ApiCreatedResponse({ type: GameAnswerResultDto })
  @ApiConflictResponse({
    description: 'Game is inactive or this player already answered',
  })
  @ApiNotFoundResponse({ description: 'Game or player not found' })
  submitAnswer(
    @Param('gameSessionId', ParseUUIDPipe) gameSessionId: string,
    @Body() dto: SubmitGameAnswerDto,
  ) {
    return this.gameService.submitAnswer(gameSessionId, dto);
  }

  @Get(':gameSessionId/leaderboard')
  @ApiOperation({
    summary: 'Get the live leaderboard',
    description:
      'Returns players ordered by score, then join time. The same data is broadcast as game:leaderboard.',
  })
  @ApiOkResponse({ type: GameLeaderboardDto })
  @ApiNotFoundResponse({ description: 'Game not found' })
  getLeaderboard(@Param('gameSessionId', ParseUUIDPipe) gameSessionId: string) {
    return this.gameService.getLeaderboard(gameSessionId);
  }

  @Post(':gameSessionId/end')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'End a live game',
    description:
      'Host-only. Stops accepting answers and broadcasts game:ended with the final leaderboard.',
  })
  @ApiOkResponse({ description: 'Game ended successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Only the host can end the game' })
  @ApiConflictResponse({ description: 'Game has already ended' })
  async endGame(
    @Param('gameSessionId', ParseUUIDPipe) gameSessionId: string,
    @CurrentUser() user: { id: string },
  ): Promise<{ message: string }> {
    await this.gameService.endGame(gameSessionId, user.id);
    return { message: 'Game ended successfully' };
  }
}
