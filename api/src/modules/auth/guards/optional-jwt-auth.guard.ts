import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = any>(err: any, user: TUser | false): TUser | undefined {
    // Se houver erro ou não tiver usuário, retorna undefined (Guest)
    // Se tiver usuário válido, retorna o objeto user.
    return user ? user : undefined;
  }
}
