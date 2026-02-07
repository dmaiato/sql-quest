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
    const schemaName = `play_${userId.replace(/-/g, '_')}`;

    // --- BLOCO ADMIN ---
    const queryRunnerAdmin = this.adminDS.createQueryRunner();
    await queryRunnerAdmin.connect();

    let mission: Mission | null;

    try {
      // 1. Busca a missão ANTES de mudar o search_path
      mission = await queryRunnerAdmin.manager.findOne(Mission, {
        where: { id: missionId },
      });
      if (!mission) throw new BadRequestException('Missão não encontrada');

      // 2. Prepara o Sandbox
      await queryRunnerAdmin.query(`SELECT setup_user_sandbox($1)`, [userId]);

      // 3. Muda o path do Admin para incluir o sandbox E o public (para ele não se perder)
      await queryRunnerAdmin.query(`SET search_path TO ${schemaName}, public`);

      // 4. Popula o Sandbox
      await queryRunnerAdmin.query(mission.sqlSetup);

      // 5. RESET: Volta o Admin para o padrão antes de liberar a conexão
      await queryRunnerAdmin.query(`SET search_path TO DEFAULT`);
    } catch (err) {
      await queryRunnerAdmin.query(`SET search_path TO DEFAULT`);
      throw err;
    } finally {
      await queryRunnerAdmin.release();
    }

    // --- BLOCO PLAYER ---
    const queryRunnerPlayer = this.playerDS.createQueryRunner();
    await queryRunnerPlayer.connect();

    try {
      // 1. O Jogador entra APENAS no sandbox (Segurança Máxima)
      await queryRunnerPlayer.query(`SET search_path TO ${schemaName}`);

      // 2. Executa a query
      const result: unknown = await queryRunnerPlayer.query(userQuery);

      // 3. RESET: Limpa a conexão do player
      await queryRunnerPlayer.query(`SET search_path TO DEFAULT`);

      return { success: true, data: result };
    } catch (error) {
      await queryRunnerPlayer.query(`SET search_path TO DEFAULT`);
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erro SQL: ${message}`);
    } finally {
      await queryRunnerPlayer.release();
    }
  }
}
