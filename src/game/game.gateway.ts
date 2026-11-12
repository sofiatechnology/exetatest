import { UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
  WsResponse,
} from '@nestjs/websockets';
import { InjectModel } from '@nestjs/sequelize';
import { isUUID } from 'class-validator';
import { Server, Socket } from 'socket.io';
import { GamePlayer } from '../models/game-player.model';
import { GameSession, GameSessionStatus } from '../models/game-session.model';
import { JwtPayload } from '../auth/jwt.strategy';
import { ALLOWED_ORIGINS } from '../common/constants/allowed-origins';
import { GameLeaderboardDto } from './dto/game-response.dto';
import { GameQuestionDto } from './dto/game-question.dto';
import { GameSocketJoinDto } from './dto/game-socket-join.dto';

@WebSocketGateway({
  namespace: '/games',
  cors: { origin: ALLOWED_ORIGINS },
})
export class GameGateway {
  @WebSocketServer()
  private server: Server;

  constructor(
    @InjectModel(GameSession)
    private readonly gameSessionModel: typeof GameSession,
    @InjectModel(GamePlayer)
    private readonly gamePlayerModel: typeof GamePlayer,
    private readonly jwtService: JwtService,
  ) {}

  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )
  @SubscribeMessage('game:join')
  async joinGameRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() dto: GameSocketJoinDto,
  ): Promise<WsResponse<Record<string, string | null>>> {
    if (!/^\d{6}$/.test(dto.pin_code)) {
      throw new WsException('A six-digit game PIN is required');
    }

    const session = await this.gameSessionModel.findOne({
      where: { pin_code: dto.pin_code },
      attributes: ['id', 'host_id', 'status'],
    });
    if (!session || session.status === GameSessionStatus.ENDED) {
      throw new WsException('Game not found or already ended');
    }

    let role: 'host' | 'player';
    let playerId: string | null = null;
    if (dto.player_id) {
      if (!isUUID(dto.player_id)) {
        throw new WsException('A valid player ID is required');
      }
      const player = await this.gamePlayerModel.findOne({
        where: {
          id: dto.player_id,
          game_session_id: session.id,
        },
        attributes: ['id'],
      });
      if (!player) {
        throw new WsException('Player is not part of this game');
      }
      role = 'player';
      playerId = player.id;
    } else {
      const token = this.getAccessToken(client);
      if (!token) {
        throw new WsException('A player ID or host access token is required');
      }

      let payload: JwtPayload;
      try {
        payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      } catch (error: unknown) {
        if (error instanceof Error) {
          throw new WsException('Invalid or expired access token');
        }
        throw error;
      }
      if (payload.userId !== session.host_id) {
        throw new WsException('Only the host can watch this game as host');
      }
      role = 'host';
    }

    await client.join(session.id);
    return {
      event: 'game:joined',
      data: {
        game_session_id: session.id,
        role,
        player_id: playerId,
      },
    };
  }

  emitPlayerJoined(
    gameSessionId: string,
    player: Pick<GamePlayer, 'id' | 'nickname' | 'score'>,
  ): void {
    this.server.to(gameSessionId).emit('game:player-joined', {
      player_id: player.id,
      nickname: player.nickname,
      score: player.score,
    });
  }

  emitQuestion(gameSessionId: string, question: GameQuestionDto): void {
    this.server.to(gameSessionId).emit('game:question', question);
  }

  emitLeaderboard(leaderboard: GameLeaderboardDto): void {
    this.server
      .to(leaderboard.game_session_id)
      .emit('game:leaderboard', leaderboard);
  }

  emitStarted(gameSessionId: string, startedAt: Date): void {
    this.server.to(gameSessionId).emit('game:started', {
      game_session_id: gameSessionId,
      started_at: startedAt,
    });
  }

  emitEnded(gameSessionId: string, endedAt: Date): void {
    this.server.to(gameSessionId).emit('game:ended', {
      game_session_id: gameSessionId,
      ended_at: endedAt,
    });
  }

  private getAccessToken(client: Socket): string | null {
    const authToken: unknown = client.handshake.auth?.token;
    if (typeof authToken === 'string' && authToken.length > 0) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      return authorization.slice('Bearer '.length);
    }
    return null;
  }
}
