import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken, getModelToken } from '@nestjs/sequelize';
import { GamePlayer } from '../models/game-player.model';
import { GameSession, GameSessionStatus } from '../models/game-session.model';
import { PlayerAnswer } from '../models/player-answer.model';
import { Question } from '../models/question.model';
import { QuestionResponse } from '../models/question-response.model';
import { Revision } from '../models/revision.model';
import { RevisionQuestion } from '../models/revision-question.model';
import { GameGateway } from './game.gateway';
import { calculateGameScore } from './game.service';
import { GameService } from './game.service';

interface MockTransaction {
  LOCK: { UPDATE: string };
}

interface PlayerAnswerOptions {
  where: { game_player_id: string; question_id: string };
  defaults: {
    game_player_id: string;
    question_id: string;
    response_id: string;
    is_correct: boolean;
    time_taken_ms: number;
  };
  transaction: MockTransaction;
}

describe('calculateGameScore', () => {
  it('awards more points for faster correct answers', () => {
    expect(calculateGameScore(true, 2450, 30)).toBe(918);
    expect(calculateGameScore(true, 15000, 30)).toBe(500);
  });

  it('awards no points for an incorrect or time-expired answer', () => {
    expect(calculateGameScore(false, 1000, 30)).toBe(0);
    expect(calculateGameScore(true, 30000, 30)).toBe(0);
  });
});

describe('GameService.submitAnswer', () => {
  let service: GameService;
  let testingModule: TestingModule;

  const gameSessionId = 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d0';
  const playerId = 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d1';
  const questionId = 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d2';
  const responseId = 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d3';

  const sessionModel = {
    findByPk: jest.fn(),
  };
  const playerModel = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const answerModel = {
    findOrCreate: jest.fn<Promise<[object, boolean]>, [PlayerAnswerOptions]>(),
  };
  const revisionQuestionModel = {
    count: jest.fn(),
    findAll: jest.fn(),
  };
  const questionResponseModel = {
    findOne: jest.fn(),
  };
  const gateway = {
    emitLeaderboard: jest.fn(),
  };
  const transaction: MockTransaction = { LOCK: { UPDATE: 'UPDATE' } };
  const sequelize = {
    transaction: jest.fn(
      async <T>(callback: (value: MockTransaction) => Promise<T>) =>
        callback(transaction),
    ),
  };

  const correctResponse = { id: responseId, is_correct: true };
  const incorrectResponse = {
    id: 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d4',
    is_correct: false,
  };
  const question = {
    id: questionId,
    text: 'What is the capital of North Kivu?',
    question: null,
    time_limit: 30,
    time: null,
    responses: [correctResponse, incorrectResponse],
  };
  const revisionQuestion = {
    time_limit: null,
    question,
  };
  const session = {
    id: gameSessionId,
    revision_id: 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d5',
    host_id: 'c0d0e0f0-a0b0-40c0-80d0-e0f0a0b0c0d6',
    status: GameSessionStatus.ACTIVE,
    current_question_index: 1,
    question_started_at: new Date(Date.now() - 1000),
  };
  const player = {
    id: playerId,
    game_session_id: gameSessionId,
    nickname: 'Birusha',
    score: 0,
    increment: jest.fn(),
    reload: jest.fn(),
  };

  beforeEach(async () => {
    sessionModel.findByPk.mockResolvedValue(session);
    revisionQuestionModel.findAll.mockResolvedValue([revisionQuestion]);
    revisionQuestionModel.count.mockResolvedValue(1);
    questionResponseModel.findOne.mockResolvedValue(correctResponse);
    playerModel.findOne.mockResolvedValue(player);
    playerModel.findAll.mockResolvedValue([player]);
    answerModel.findOrCreate.mockResolvedValue([{}, true]);
    player.increment.mockImplementation(
      async (_field: string, options: { by: number }) => {
        player.score += options.by;
      },
    );
    player.reload.mockResolvedValue(player);

    testingModule = await Test.createTestingModule({
      providers: [
        GameService,
        { provide: getModelToken(GameSession), useValue: sessionModel },
        { provide: getModelToken(GamePlayer), useValue: playerModel },
        { provide: getModelToken(PlayerAnswer), useValue: answerModel },
        { provide: getModelToken(Revision), useValue: {} },
        {
          provide: getModelToken(RevisionQuestion),
          useValue: revisionQuestionModel,
        },
        { provide: getModelToken(Question), useValue: {} },
        {
          provide: getModelToken(QuestionResponse),
          useValue: questionResponseModel,
        },
        { provide: getConnectionToken(), useValue: sequelize },
        { provide: GameGateway, useValue: gateway },
      ],
    }).compile();

    service = testingModule.get(GameService);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await testingModule.close();
  });

  it('stores the validated answer and awards points without returning correctness', async () => {
    const result = await service.submitAnswer(gameSessionId, {
      game_player_id: playerId,
      response_id: responseId,
      time_taken_ms: 2450,
    });

    expect(answerModel.findOrCreate.mock.calls[0]?.[0].defaults).toEqual({
      game_player_id: playerId,
      question_id: questionId,
      response_id: responseId,
      is_correct: true,
      time_taken_ms: 2450,
    });
    expect(result).toEqual({
      accepted: true,
      points_awarded: 918,
      time_taken_ms: 2450,
      total_score: 918,
    });
    expect(result).not.toHaveProperty('is_correct');
    expect(gateway.emitLeaderboard).toHaveBeenCalledTimes(1);
  });
});
