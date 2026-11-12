import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize, Transaction } from 'sequelize';
import { GamePlayer } from '../models/game-player.model';
import { GameSession, GameSessionStatus } from '../models/game-session.model';
import { PlayerAnswer } from '../models/player-answer.model';
import { Question } from '../models/question.model';
import { QuestionResponse } from '../models/question-response.model';
import { Revision } from '../models/revision.model';
import { RevisionQuestion } from '../models/revision-question.model';
import { CreateGameDto } from './dto/create-game.dto';
import { GameQuestionDto } from './dto/game-question.dto';
import {
  GameAdvanceResponseDto,
  GameAnswerResultDto,
  GameLeaderboardDto,
  GameResponseDto,
  JoinGameResponseDto,
} from './dto/game-response.dto';
import { JoinGameDto } from './dto/join-game.dto';
import { SubmitGameAnswerDto } from './dto/submit-game-answer.dto';
import { GameGateway } from './game.gateway';

const DEFAULT_TIME_LIMIT_SECONDS = 30;
const MAX_QUESTION_SCORE = 1000;

export function calculateGameScore(
  isCorrect: boolean,
  timeTakenMs: number,
  timeLimitSeconds: number,
): number {
  if (!isCorrect) {
    return 0;
  }
  const timeLimitMs = timeLimitSeconds * 1000;
  return Math.max(
    0,
    Math.round(MAX_QUESTION_SCORE * (1 - timeTakenMs / timeLimitMs)),
  );
}

@Injectable()
export class GameService {
  constructor(
    @InjectModel(GameSession)
    private readonly gameSessionModel: typeof GameSession,
    @InjectModel(GamePlayer)
    private readonly gamePlayerModel: typeof GamePlayer,
    @InjectModel(PlayerAnswer)
    private readonly playerAnswerModel: typeof PlayerAnswer,
    @InjectModel(Revision)
    private readonly revisionModel: typeof Revision,
    @InjectModel(RevisionQuestion)
    private readonly revisionQuestionModel: typeof RevisionQuestion,
    @InjectModel(Question)
    private readonly questionModel: typeof Question,
    @InjectModel(QuestionResponse)
    private readonly questionResponseModel: typeof QuestionResponse,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly gameGateway: GameGateway,
  ) {}

  async createGame(
    hostId: string,
    dto: CreateGameDto,
  ): Promise<GameResponseDto> {
    const revision = await this.revisionModel.findByPk(dto.revision_id);
    if (!revision) {
      throw new NotFoundException('Revision not found');
    }
    if (revision.user_id !== hostId && !revision.is_public) {
      throw new ForbiddenException('You cannot host this revision');
    }

    const questionCount = await this.revisionQuestionModel.count({
      where: { revision_id: revision.id },
    });
    if (questionCount === 0) {
      throw new BadRequestException('Revision has no questions');
    }

    const session = await this.gameSessionModel.create({
      revision_id: revision.id,
      host_id: hostId,
    });
    return {
      id: session.id,
      pin_code: session.pin_code,
      status: session.status,
      current_question_index: session.current_question_index,
      question_count: questionCount,
      players: [],
      current_question: null,
    };
  }

  async joinGame(dto: JoinGameDto): Promise<JoinGameResponseDto> {
    const nickname = dto.nickname.trim();
    if (!nickname) {
      throw new BadRequestException('Nickname is required');
    }

    const player = await this.sequelize.transaction(async (transaction) => {
      const session = await this.gameSessionModel.findOne({
        where: { pin_code: dto.pin_code },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!session || session.status !== GameSessionStatus.WAITING) {
        throw new NotFoundException('Waiting game not found');
      }

      return this.gamePlayerModel.create(
        {
          game_session_id: session.id,
          nickname,
          user_id: null,
        },
        { transaction },
      );
    });

    this.gameGateway.emitPlayerJoined(player.game_session_id, player);
    const leaderboard = await this.getLeaderboard(player.game_session_id);
    this.gameGateway.emitLeaderboard(leaderboard);

    const session = await this.getSessionOrFail(player.game_session_id);
    return {
      game_session_id: session.id,
      player_id: player.id,
      nickname: player.nickname,
      pin_code: session.pin_code,
      status: session.status,
    };
  }

  async getGame(gameSessionId: string): Promise<GameResponseDto> {
    const session = await this.getSessionOrFail(gameSessionId);
    const questionCount = await this.getQuestionCount(session.revision_id);
    const leaderboard = await this.getLeaderboard(gameSessionId);
    let currentQuestion: GameQuestionDto | null = null;

    if (
      session.status === GameSessionStatus.ACTIVE &&
      session.current_question_index > 0 &&
      session.question_started_at
    ) {
      const revisionQuestion = await this.getRevisionQuestion(
        session,
        session.current_question_index,
      );
      if (revisionQuestion) {
        currentQuestion = this.toGameQuestion(
          revisionQuestion,
          session.current_question_index,
          questionCount,
          session.question_started_at,
        );
      }
    }

    return {
      id: session.id,
      pin_code: session.pin_code,
      status: session.status,
      current_question_index: session.current_question_index,
      question_count: questionCount,
      players: leaderboard.leaderboard.map((entry) => ({
        id: entry.player_id,
        nickname: entry.nickname,
        score: entry.score,
      })),
      current_question: currentQuestion,
    };
  }

  async startGame(
    gameSessionId: string,
    hostId: string,
  ): Promise<GameAdvanceResponseDto> {
    const result = await this.sequelize.transaction(async (transaction) => {
      const session = await this.getLockedSession(gameSessionId, transaction);
      this.assertHost(session, hostId);
      if (session.status !== GameSessionStatus.WAITING) {
        throw new ConflictException('Game has already started or ended');
      }

      const questionCount = await this.getQuestionCount(
        session.revision_id,
        transaction,
      );
      const openedAt = new Date();
      const revisionQuestion = await this.getPlayableRevisionQuestion(
        session,
        1,
        transaction,
      );
      session.status = GameSessionStatus.ACTIVE;
      session.current_question_index = 1;
      session.started_at = openedAt;
      session.question_started_at = openedAt;
      await session.save({ transaction });

      return {
        status: session.status,
        question: this.toGameQuestion(
          revisionQuestion,
          1,
          questionCount,
          openedAt,
        ),
        startedAt: openedAt,
      };
    });

    this.gameGateway.emitStarted(gameSessionId, result.startedAt);
    this.gameGateway.emitQuestion(gameSessionId, result.question);
    return {
      status: result.status,
      current_question: result.question,
    };
  }

  async nextQuestion(
    gameSessionId: string,
    hostId: string,
  ): Promise<GameAdvanceResponseDto> {
    const result = await this.sequelize.transaction(async (transaction) => {
      const session = await this.getLockedSession(gameSessionId, transaction);
      this.assertHost(session, hostId);
      if (session.status !== GameSessionStatus.ACTIVE) {
        throw new ConflictException('Game is not active');
      }

      const nextIndex = session.current_question_index + 1;
      const questionCount = await this.getQuestionCount(
        session.revision_id,
        transaction,
      );
      if (nextIndex > questionCount) {
        session.status = GameSessionStatus.ENDED;
        session.ended_at = new Date();
        session.question_started_at = null;
        await session.save({ transaction });
        return {
          status: session.status,
          question: null,
          endedAt: session.ended_at,
        };
      }

      const openedAt = new Date();
      const revisionQuestion = await this.getPlayableRevisionQuestion(
        session,
        nextIndex,
        transaction,
      );
      session.current_question_index = nextIndex;
      session.question_started_at = openedAt;
      await session.save({ transaction });

      return {
        status: session.status,
        question: this.toGameQuestion(
          revisionQuestion,
          nextIndex,
          questionCount,
          openedAt,
        ),
        endedAt: null,
      };
    });

    if (result.question) {
      this.gameGateway.emitQuestion(gameSessionId, result.question);
    } else if (result.endedAt) {
      this.gameGateway.emitEnded(gameSessionId, result.endedAt);
      this.gameGateway.emitLeaderboard(
        await this.getLeaderboard(gameSessionId),
      );
    }

    return {
      status: result.status,
      current_question: result.question,
    };
  }

  async submitAnswer(
    gameSessionId: string,
    dto: SubmitGameAnswerDto,
  ): Promise<GameAnswerResultDto> {
    const result = await this.sequelize.transaction(async (transaction) => {
      const session = await this.getLockedSession(gameSessionId, transaction);
      if (session.status !== GameSessionStatus.ACTIVE) {
        throw new ConflictException('Game is not accepting answers');
      }
      if (!session.question_started_at) {
        throw new ConflictException('The current question has not started');
      }

      const revisionQuestion = await this.getPlayableRevisionQuestion(
        session,
        session.current_question_index,
        transaction,
      );
      const question = revisionQuestion.question;
      const timeLimitSeconds = this.getTimeLimitSeconds(revisionQuestion);
      const serverTimeTakenMs = Math.max(
        0,
        Date.now() - session.question_started_at.getTime(),
      );
      const timeTakenMs = Math.max(dto.time_taken_ms, serverTimeTakenMs);
      if (timeTakenMs > timeLimitSeconds * 1000) {
        throw new BadRequestException('Answer time has expired');
      }

      const player = await this.gamePlayerModel.findOne({
        where: {
          id: dto.game_player_id,
          game_session_id: session.id,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!player) {
        throw new NotFoundException('Player is not part of this game');
      }

      const response = await this.questionResponseModel.findOne({
        where: {
          id: dto.response_id,
          question_id: question.id,
        },
        attributes: ['id', 'is_correct'],
        transaction,
      });
      if (!response) {
        throw new BadRequestException(
          'Response does not belong to the current question',
        );
      }

      const points = calculateGameScore(
        response.is_correct,
        timeTakenMs,
        timeLimitSeconds,
      );
      const [, created] = await this.playerAnswerModel.findOrCreate({
        where: {
          game_player_id: player.id,
          question_id: question.id,
        },
        defaults: {
          game_player_id: player.id,
          question_id: question.id,
          response_id: response.id,
          is_correct: response.is_correct,
          time_taken_ms: timeTakenMs,
        },
        transaction,
      });
      if (!created) {
        throw new ConflictException('You have already answered this question');
      }

      if (points > 0) {
        await player.increment('score', { by: points, transaction });
      }
      await player.reload({ transaction });

      return {
        points,
        timeTakenMs,
        totalScore: player.score,
      };
    });

    this.gameGateway.emitLeaderboard(await this.getLeaderboard(gameSessionId));
    return {
      accepted: true,
      points_awarded: result.points,
      time_taken_ms: result.timeTakenMs,
      total_score: result.totalScore,
    };
  }

  async getLeaderboard(gameSessionId: string): Promise<GameLeaderboardDto> {
    await this.getSessionOrFail(gameSessionId);
    const players = await this.gamePlayerModel.findAll({
      where: { game_session_id: gameSessionId },
      attributes: ['id', 'nickname', 'score'],
      order: [
        ['score', 'DESC'],
        ['joined_at', 'ASC'],
      ],
    });
    return {
      game_session_id: gameSessionId,
      leaderboard: players.map((player, index) => ({
        rank: index + 1,
        player_id: player.id,
        nickname: player.nickname,
        score: player.score,
      })),
    };
  }

  async endGame(gameSessionId: string, hostId: string): Promise<void> {
    const endedAt = await this.sequelize.transaction(async (transaction) => {
      const session = await this.getLockedSession(gameSessionId, transaction);
      this.assertHost(session, hostId);
      if (session.status === GameSessionStatus.ENDED) {
        throw new ConflictException('Game has already ended');
      }

      const endTime = new Date();
      session.status = GameSessionStatus.ENDED;
      session.ended_at = endTime;
      session.question_started_at = null;
      await session.save({ transaction });
      return endTime;
    });

    this.gameGateway.emitEnded(gameSessionId, endedAt);
    this.gameGateway.emitLeaderboard(await this.getLeaderboard(gameSessionId));
  }

  private async getSessionOrFail(gameSessionId: string): Promise<GameSession> {
    const session = await this.gameSessionModel.findByPk(gameSessionId);
    if (!session) {
      throw new NotFoundException('Game not found');
    }
    return session;
  }

  private async getLockedSession(
    gameSessionId: string,
    transaction: Transaction,
  ): Promise<GameSession> {
    const session = await this.gameSessionModel.findByPk(gameSessionId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!session) {
      throw new NotFoundException('Game not found');
    }
    return session;
  }

  private assertHost(session: GameSession, hostId: string): void {
    if (session.host_id !== hostId) {
      throw new ForbiddenException('Only the host can control this game');
    }
  }

  private async getQuestionCount(
    revisionId: string,
    transaction?: Transaction,
  ): Promise<number> {
    return this.revisionQuestionModel.count({
      where: { revision_id: revisionId },
      transaction,
    });
  }

  private async getRevisionQuestion(
    session: GameSession,
    questionIndex: number,
    transaction?: Transaction,
  ): Promise<RevisionQuestion | null> {
    const questions = await this.revisionQuestionModel.findAll({
      where: { revision_id: session.revision_id },
      include: [
        {
          model: this.questionModel,
          include: [
            {
              model: this.questionResponseModel,
              attributes: ['id', 'option_text', 'is_correct'],
            },
          ],
        },
      ],
      order: [
        ['question_order', 'ASC'],
        ['createdAt', 'ASC'],
      ],
      limit: 1,
      offset: questionIndex - 1,
      transaction,
    });
    return questions[0] ?? null;
  }

  private async getPlayableRevisionQuestion(
    session: GameSession,
    questionIndex: number,
    transaction?: Transaction,
  ): Promise<RevisionQuestion> {
    const revisionQuestion = await this.getRevisionQuestion(
      session,
      questionIndex,
      transaction,
    );
    if (!revisionQuestion) {
      throw new NotFoundException('Question not found in this revision');
    }

    const question = revisionQuestion.question;
    if (!(question.text ?? question.question)?.trim()) {
      throw new BadRequestException('Question text is required for live games');
    }
    const correctResponses = question.responses.filter(
      (response) => response.is_correct,
    );
    if (question.responses.length < 2 || correctResponses.length !== 1) {
      throw new BadRequestException(
        'Each live game question must have at least two responses and exactly one correct response',
      );
    }
    return revisionQuestion;
  }

  private getTimeLimitSeconds(revisionQuestion: RevisionQuestion): number {
    const timeLimit =
      revisionQuestion.time_limit ??
      revisionQuestion.question.time_limit ??
      revisionQuestion.question.time ??
      DEFAULT_TIME_LIMIT_SECONDS;
    if (!Number.isInteger(timeLimit) || timeLimit < 1 || timeLimit > 2147483) {
      throw new BadRequestException(
        'Question time limit must be between 1 and 2147483 seconds',
      );
    }
    return timeLimit;
  }

  private toGameQuestion(
    revisionQuestion: RevisionQuestion,
    questionIndex: number,
    questionCount: number,
    openedAt: Date,
  ): GameQuestionDto {
    const question = revisionQuestion.question;
    return {
      question_id: question.id,
      question: question.text ?? question.question ?? '',
      question_index: questionIndex,
      question_count: questionCount,
      time_limit_seconds: this.getTimeLimitSeconds(revisionQuestion),
      options: question.responses.map((response) => ({
        id: response.id,
        option_text: response.option_text,
      })),
      opened_at: openedAt,
    };
  }
}
