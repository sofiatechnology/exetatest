import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { UsersService } from '../../users/users.service';

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

@Injectable()
export class ActivityStreakInterceptor implements NestInterceptor {
  constructor(private readonly usersService: UsersService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.id;

    if (userId) {
      const timezoneOffsetMinutes = UsersService.parseTimezoneOffsetMinutes(
        request.headers['x-timezone-offset-minutes'],
      );
      await this.usersService.updateStreak(userId, timezoneOffsetMinutes);
    }

    return next.handle();
  }
}
