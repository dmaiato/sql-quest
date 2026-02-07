import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Mission } from '../mission/mission.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectDataSource('default') private adminDS: DataSource,
    @InjectDataSource('player_connection') private playerDS: DataSource,
  ) {}

  async executeQuery(userId: string, missionId: number, userQuery: string) {
    // 1. Sanitização básica (Implemente uma mais robusta depois)
    if (
      /drop|alter|truncate|grant|revoke|insert|update|delete/i.test(userQuery)
    ) {
      // Por enquanto, bloqueamos escrita para teste inicial
      // Depois liberaremos INSERT/DELETE conforme sua regra de negócio
      // throw new BadRequestException('Apenas consultas (SELECT) são permitidas nesta fase.');
    }

    const schemaName = `play_${userId.replace(/-/g, '_')}`;

    // --- BLOCO ADMIN (Prepara o Terreno) ---
    const queryRunnerAdmin = this.adminDS.createQueryRunner();
    await queryRunnerAdmin.connect();

    try {
      // Busca a missão
      const mission = await queryRunnerAdmin.manager.findOne(Mission, {
        where: { id: missionId },
      });
      if (!mission) throw new BadRequestException('Missão não encontrada');

      // Cria o Sandbox (Chama a função do Banco)
      await queryRunnerAdmin.query(`SELECT setup_user_sandbox($1)`, [userId]);

      // Popula o Sandbox com os dados do crime
      // Importante: setar o search_path para o schema criado
      await queryRunnerAdmin.query(`SET search_path TO ${schemaName}`);
      await queryRunnerAdmin.query(mission.sqlSetup);
    } finally {
      await queryRunnerAdmin.release();
    }

    // --- BLOCO PLAYER (Executa a Investigação) ---
    const queryRunnerPlayer = this.playerDS.createQueryRunner();
    await queryRunnerPlayer.connect();

    try {
      // Player entra no sandbox
      await queryRunnerPlayer.query(`SET search_path TO ${schemaName}`);

      // Executa a query do usuário
      const result: unknown = await queryRunnerPlayer.query(userQuery);

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erro SQL: ${message}`);
    } finally {
      await queryRunnerPlayer.release();
    }
  }
}
