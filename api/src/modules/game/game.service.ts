import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Mission } from '../mission/mission.entity';
import { PlayerConnection } from '../database/player-connection';
import { MissionValidator } from './mission-validator/mission-validator';

@Injectable()
export class GameService {
  constructor(
    @InjectDataSource('default') private adminDS: DataSource,
    private playerConn: PlayerConnection, // Injeção do novo provedor
    private validator: MissionValidator,
  ) {}

  async executeQuery(userId: string, missionId: number, userQuery: string) {
    const schemaName = `play_${userId.replace(/-/g, '_')}`;

    // 1. Bloco Admin (Garante o Usuário e o Schema)
    // Aqui o DatabaseSetupService já rodou no boot do Nest!
    const queryRunnerAdmin = this.adminDS.createQueryRunner();
    await queryRunnerAdmin.connect();

    let expectedData: Record<string, unknown>[];
    try {
      const mission = await queryRunnerAdmin.manager.findOne(Mission, {
        where: { id: missionId },
      });
      if (!mission) throw new BadRequestException('Missão não encontrada');

      await queryRunnerAdmin.query(`SELECT setup_user_sandbox($1)`, [userId]);
      await queryRunnerAdmin.query(
        `SET search_path TO "${schemaName}", public`,
      );
      // mission setup
      await queryRunnerAdmin.query(mission.sqlSetup);
      // extracting expected result
      expectedData = (await queryRunnerAdmin.query(
        mission.sqlValidation,
      )) as Record<string, unknown>[];
    } finally {
      await queryRunnerAdmin.release();
    }

    // 2. Bloco Player (Conecta APENAS agora)
    const playerDS = await this.playerConn.getDataSource();
    const queryRunnerPlayer = playerDS.createQueryRunner();
    await queryRunnerPlayer.connect();

    try {
      await queryRunnerPlayer.query(`SET search_path TO "${schemaName}"`);

      const result = (await queryRunnerPlayer.query(userQuery)) as Record<
        string,
        unknown
      >[];
      const validation = this.validator.validate(
        result || [],
        expectedData || [],
      );

      return {
        success: validation.success,
        message: validation.message,
        data: result, // Dados para renderizar a tabela no frontend
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Erro SQL: ${message}`);
    } finally {
      await queryRunnerPlayer.release();
    }
  }
}
