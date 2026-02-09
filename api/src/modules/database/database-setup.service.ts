import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseSetupService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseSetupService.name);

  constructor(
    @InjectDataSource('default') private adminDS: DataSource,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    this.logger.log('Iniciando verificação de integridade de segurança...');
    await this.ensurePlayerRole();
  }

  private async ensurePlayerRole() {
    const playerRole = this.config.get<string>('DB_USER_PLAYER');
    const playerPass = this.config.get<string>('DB_PASS_PLAYER');
    const dbName = this.config.get<string>('DB_NAME');
    const timeout = this.config.get<string>('QUERY_TIMEOUT');

    if (!playerRole || !playerPass || !dbName) {
      this.logger.error('❌ Configuração de banco de dados incompleta.');
      return;
    }

    const safeRoleIdentifier = this.quoteId(playerRole);
    const safeRoleLiteral = this.quoteLit(playerRole);
    const safePassLiteral = this.quoteLit(playerPass);
    const safeDbIdentifier = this.quoteId(dbName);
    const safeTimeout = parseInt(timeout || '5000', 10);

    try {
      // 1. Create or Update Role
      await this.adminDS.query(`
        DO
        $do$
        BEGIN
          IF NOT EXISTS (
              SELECT FROM pg_catalog.pg_roles WHERE rolname = ${safeRoleLiteral}) THEN
              CREATE ROLE ${safeRoleIdentifier} WITH LOGIN PASSWORD ${safePassLiteral};
          ELSE
              ALTER ROLE ${safeRoleIdentifier} WITH PASSWORD ${safePassLiteral};
          END IF;
        END
        $do$;
      `);

      // 2. Set Timeout
      await this.adminDS.query(
        `ALTER ROLE ${safeRoleIdentifier} SET statement_timeout = '${safeTimeout}ms'`,
      );

      // 3. Reset Privileges
      await this.adminDS.query(
        `REVOKE ALL PRIVILEGES ON DATABASE ${safeDbIdentifier} FROM ${safeRoleIdentifier}`,
      );
      await this.adminDS.query(
        `REVOKE ALL PRIVILEGES ON SCHEMA public FROM ${safeRoleIdentifier}`,
      );

      // 4. Grant Connection
      await this.adminDS.query(
        `GRANT CONNECT ON DATABASE ${safeDbIdentifier} TO ${safeRoleIdentifier}`,
      );

      // 5. Set Default Privileges (Read Only)
      await this.adminDS.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${safeRoleIdentifier}`,
      );
      await this.adminDS.query(
        `ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLES FROM ${safeRoleIdentifier}`,
      );

      this.logger.log(
        `✅ Usuário: ${safeRoleIdentifier} sincronizado e ativo.`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Erro ao sincronizar usuário restrito:',
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Helper to escape SQL identifiers (e.g. table/role names) -> "name"
  private quoteId(s: string): string {
    return `"${s.replace(/"/g, '""')}"`;
  }

  // Helper to escape SQL string literals -> 'value'
  private quoteLit(s: string): string {
    return `'${s.replace(/'/g, "''")}'`;
  }
}
