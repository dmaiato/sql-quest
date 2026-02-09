import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './modules/mission/entity/mission.entity';
import { GameModule } from './modules/game/game.module';
import { DatabaseModule } from './modules/database/database.module';
import { FingerprintValidator } from './modules/game/strategies/fingerprint-validator';
import { MissionRepository } from './modules/mission/repository/mission.repository';
import { MissionModule } from './modules/mission/mission.module';

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
    // TypeOrmModule.forRootAsync({
    //   name: 'player_connection', // Nome para injeção posterior
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: (config: ConfigService) => ({
    //     type: 'postgres',
    //     url: config.get('DATABASE_PLAYER_URL'),
    //     retryAttempts: 5, // Tenta 5 vezes antes de desistir
    //     retryDelay: 3000, // Espera 3s entre as tentativas
    //     keepConnectionAlive: true,
    //     entities: [], // O player não vê as tabelas do sistema
    //     synchronize: false,
    //     logging: false,
    //   }),
    // }),

    GameModule,

    DatabaseModule,

    MissionModule,
  ],
  controllers: [],
  providers: [FingerprintValidator, MissionRepository],
})
export class AppModule {}
