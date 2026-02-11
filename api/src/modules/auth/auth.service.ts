import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Validação para a estratégia Local (Email/Senha)
   */
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    if (!user) return null;

    // Comparação segura com bcrypt
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) return null;

    // Retorna o usuário sem a senha (o TypeORM já remove se select: false,
    // mas garantimos aqui por segurança)
    const { password, ...result } = user;
    return result;
  }

  /**
   * Gera o Token JWT.
   * Recebe o objeto do usuário vindo do banco ou do validateUser.
   */
  login(user: Partial<User>) {
    if (!user.id || !user.email) {
      throw new UnprocessableEntityException(
        'Dados de usuário insuficientes para login.',
      );
    }

    const payload = {
      email: user.email,
      sub: user.id, // O 'sub' deve ser o ID único (UUID)
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nickname: user.nickname,
        xp: user.totalXp ?? 0,
      },
    };
  }

  /**
   * Registro de novo usuário com login automático
   */
  async register(email: string, pass: string, nickname: string) {
    // 1. Criptografia da senha ANTES de enviar para o service
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(pass, salt);

    // 2. Tenta criar o usuário (o UsersService já deve tratar e-mail duplicado)
    const newUser = await this.usersService.create(
      email,
      hashedPassword,
      nickname,
    );

    // 3. Retorna o login imediato
    return this.login(newUser);
  }
}
