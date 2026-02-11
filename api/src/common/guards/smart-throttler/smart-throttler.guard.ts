import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class SmartThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, any>): Promise<string> {
    // 1. Se estiver logado (via Passport/JWT), rastreia pelo ID do usuário
    if (req['user'] && (req['user'] as { id?: string | number }).id) {
      return Promise.resolve(
        String((req['user'] as { id: string | number }).id),
      );
    }
    // 2. Se for Guest, rastreia pela combinação IP + GuestID para evitar spoofing
    const guestId = (
      req.headers as Record<string, string | undefined> | undefined
    )?.['x-guest-id'];
    const ips = req['ips'] as string[] | undefined;
    const ip = ips?.length ? ips[0] : (req['ip'] as string); // Suporte a proxy

    if (guestId) {
      return Promise.resolve(`guest_${ip}_${guestId}`);
    }

    // 3. Fallback: Rastreia apenas pelo IP
    return Promise.resolve(ip);
  }

  // Sobrescreve a mensagem de erro padrão
  protected throwThrottlingException(
    context: ExecutionContext,
  ): Promise<never> {
    throw new ThrottlerException('Muitas requisições. Acalme-se, hacker.');
  }
}
