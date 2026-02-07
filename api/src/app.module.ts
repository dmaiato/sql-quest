import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './modules/mission/mission.entity';
import { GameModule } from './modules/game/game.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // 1. Conexão ADMIN (Default)
    TypeOrmModule.forRootAsync({
      name: 'default', // Nome da conexão principal
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_ADMIN_URL'),
        entities: [Mission], // Adicione suas entidades aqui
        synchronize: false, // Sempre false em produção/projetos sérios
        logging: ['error'],
      }),
    }),

    // 2. Conexão PLAYER (Restrita)
    TypeOrmModule.forRootAsync({
      name: 'player_connection', // Nome para injeção posterior
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_PLAYER_URL'),
        entities: [], // O player não vê as tabelas do sistema
        synchronize: false,
        logging: false,
      }),
    }),

    GameModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
