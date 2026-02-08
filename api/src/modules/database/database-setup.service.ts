import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseSetupService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSetupService.name);

  constructor(@InjectDataSource('default') private adminDS: DataSource) {}

  async onModuleInit() {
    this.logger.log('Iniciando verificação de integridade de segurança...');
    await this.ensurePlayerRole();
  }

  private async ensurePlayerRole() {
    const playerPass = 'senha_jogador_123'; // No futuro, use process.env.PLAYER_PASS

    try {
      await this.adminDS.query(`
        DO $$ 
        BEGIN
          -- 1. Garante que o usuário existe
          IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'player_restricted') THEN
            CREATE ROLE player_restricted WITH LOGIN PASSWORD '${playerPass}';
          ELSE
            -- 2. "AUTO-CURA": Garante que a senha seja sempre a que está no código/env
            ALTER ROLE player_restricted WITH PASSWORD '${playerPass}';
          END IF;

          -- 3. Configurações de segurança que podem ter sido perdidas num restart
          ALTER ROLE player_restricted SET statement_timeout = '5000';
          REVOKE ALL ON SCHEMA public FROM player_restricted;
          EXECUTE format('GRANT CONNECT ON DATABASE %I TO player_restricted', current_database());
        END $$;
      `);
      this.logger.log('✅ Usuário player_restricted sincronizado e ativo.');
    } catch (error) {
      this.logger.error(
        '❌ Erro ao sincronizar usuário restrito:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
