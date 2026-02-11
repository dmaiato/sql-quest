import { Injectable, BadRequestException } from '@nestjs/common';
import { PlayerConnection } from 'src/modules/database/player-connection';
import { QueryRunner } from 'typeorm';

@Injectable()
export class ExecutionService {
  constructor(private readonly playerConn: PlayerConnection) {}

  async executePreview(
    schema: string,
    userSql: string,
  ): Promise<Record<string, unknown>[]> {
    return this.runInRestrictedContext<Record<string, unknown>[]>(
      schema,
      async (runner) => {
        return await this.runUserQuerySafe(runner, userSql);
      },
    );
  }

  async executeChallenge(
    schema: string,
    userSql: string,
    validSql: string,
  ): Promise<{
    userData: Record<string, unknown>[];
    expectedData: Record<string, unknown>[];
  }> {
    return this.runInRestrictedContext(schema, async (runner) => {
      const userData = await this.runUserQuerySafe(runner, userSql);
      // O gabarito (validSql) roda na mesma sessão para ver o schema
      const expectedData = (await runner.query(validSql)) as Record<
        string,
        unknown
      >[];
      return { userData, expectedData };
    });
  }

  private async runInRestrictedContext<T>(
    schema: string,
    operation: (runner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const playerDS = await this.playerConn.getDataSource();
    const runner = playerDS.createQueryRunner();
    await runner.connect();

    try {
      // AJUSTE CRÍTICO: Usar aspas duplas dentro da string para o Postgres identificar o schema
      // O terceiro parâmetro 'true' garante que a config vale apenas para esta transação/sessão.
      await runner.query(`SET search_path TO "${schema}"`);

      // Verificação de sanidade: Garantir que o schema existe para esta conexão
      const check = (await runner.query(`SELECT current_schema()`)) as Array<{
        current_schema: string;
      }>;
      if (check[0].current_schema !== schema) {
        throw new Error(`Falha ao trocar para o schema: ${schema}`);
      }

      return await operation(runner);
    } catch (error) {
      this.handleError(error);
    } finally {
      await runner.release();
    }
  }

  private async runUserQuerySafe(
    runner: QueryRunner,
    userSql: string,
  ): Promise<Record<string, unknown>[]> {
    const safeUserSql = userSql.trim().replace(/;+$/, '');
    // O wrapper SELECT * FROM (...) AS subquery garante que o search_path seja respeitado
    const wrappedUserQuery = `SELECT * FROM (${safeUserSql}) AS user_attempt LIMIT 500`;
    return (await runner.query(wrappedUserQuery)) as Record<string, unknown>[];
  }

  private handleError(error: unknown): never {
    const message = error instanceof Error ? error.message : String(error);

    // Se o erro for "relation does not exist", capturamos para dar um log melhor
    if (message.includes('relation') && message.includes('does not exist')) {
      throw new BadRequestException(
        `Erro de Contexto: A tabela não foi encontrada no seu ambiente de missão. Verifique se o nome está correto.`,
      );
    }

    throw new BadRequestException(`Erro SQL: ${message}`);
  }
}
