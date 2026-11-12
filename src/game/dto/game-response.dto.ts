import { ApiProperty } from '@nestjs/swagger';
import { GameSessionStatus } from '../../models/game-session.model';
import { GameQuestionDto } from './game-question.dto';

export class GamePlayerDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'Birusha' })
  nickname: string;

  @ApiProperty({ example: 850 })
  score: number;
}

export class GameResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: '482731' })
  pin_code: string;

  @ApiProperty({ enum: GameSessionStatus, example: GameSessionStatus.WAITING })
  status: GameSessionStatus;

  @ApiProperty({ example: 0 })
  current_question_index: number;

  @ApiProperty({ example: 8 })
  question_count: number;

  @ApiProperty({ type: [GamePlayerDto] })
  players: GamePlayerDto[];

  @ApiProperty({ type: GameQuestionDto, nullable: true })
  current_question: GameQuestionDto | null;
}

export class JoinGameResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  game_session_id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  player_id: string;

  @ApiProperty({ example: 'Birusha' })
  nickname: string;

  @ApiProperty({ example: '482731' })
  pin_code: string;

  @ApiProperty({ enum: GameSessionStatus, example: GameSessionStatus.WAITING })
  status: GameSessionStatus;
}

export class GameAnswerResultDto {
  @ApiProperty({ example: true })
  accepted: boolean;

  @ApiProperty({ example: 918 })
  points_awarded: number;

  @ApiProperty({ example: 2600 })
  time_taken_ms: number;

  @ApiProperty({ example: 918 })
  total_score: number;
}

export class GameAdvanceResponseDto {
  @ApiProperty({ enum: GameSessionStatus })
  status: GameSessionStatus;

  @ApiProperty({ type: GameQuestionDto, nullable: true })
  current_question: GameQuestionDto | null;
}

export class GameLeaderboardEntryDto {
  @ApiProperty({ example: 1 })
  rank: number;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  player_id: string;

  @ApiProperty({ example: 'Birusha' })
  nickname: string;

  @ApiProperty({ example: 918 })
  score: number;
}

export class GameLeaderboardDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  game_session_id: string;

  @ApiProperty({ type: [GameLeaderboardEntryDto] })
  leaderboard: GameLeaderboardEntryDto[];
}
