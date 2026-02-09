import { Injectable, BadRequestException } from '@nestjs/common';
import { PlayerConnection } from 'src/modules/database/player-connection';

@Injectable()
export class ExecutionService {
  constructor(private readonly playerConn: PlayerConnection) {}

  /**
   * Executa a query do usuário e o gabarito no mesmo contexto restrito.
   */
  async executeChallenge(schema: string, userSql: string, validSql: string) {
    const playerDS = await this.playerConn.getDataSource();
    const runner = playerDS.createQueryRunner();

    await runner.connect();

    try {
      // Força o uso do schema sandbox do usuário
      await runner.query(`SET statement_timeout = '2s'`);
      await runner.query(`SET search_path TO ${schema}`);

      // Execução em paralelo (opcional) ou sequencial
      const safeUserSql = userSql.trim().replace(/;+$/, '');

      // Se a query original for inválida, o erro do Postgres será retornado normalmente.
      // O LIMIT 500 impede que o Node.js estoure a memória (Heap OOM).
      const wrappedUserQuery = `SELECT * FROM (${safeUserSql}) AS user_view LIMIT 500`;

      // Executa
      const userData = (await runner.query(wrappedUserQuery)) as Record<
        string,
        unknown
      >[];
      const expectedData = (await runner.query(validSql)) as Record<
        string,
        unknown
      >[];

      return { userData, expectedData };
    } catch (error) {
      // Tratamento amigável de erros de sintaxe SQL do jogador
      throw new BadRequestException({
        success: false,
        message: `Erro na execução do SQL: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      try {
        await runner.query(`SET statement_timeout = 0`); // Remove o timeout para a próxima utilização
        await runner.query(`SET search_path TO DEFAULT`);
      } finally {
        await runner.release();
      }
    }
  }
}
