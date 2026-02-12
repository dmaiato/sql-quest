import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../users/entity/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user/current-user.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    // O AuthService já criptografa e salva
    return this.authService.register(
      registerDto.email,
      registerDto.password,
      registerDto.nickname,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // 1. Valida se as credenciais batem
    const user = (await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    )) as Partial<User> | null;

    if (!user) {
      throw new UnauthorizedException('E-mail ou senha incorretos.');
    }

    // 2. Gera o token JWT
    return this.authService.login(user);
  }

  /**
   * Endpoint útil para o Frontend validar o token ao carregar a página
   * e recuperar os dados do usuário (como XP e Nickname)
   */
  @ApiBearerAuth('access-token')
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getProfile(@CurrentUser() user: { id: string; email: string }) {
    // Retorna os dados básicos do usuário logado
    return user;
  }
}
