import { Injectable, BadRequestException } from '@nestjs/common';
import { MissionRepository } from '../mission/repository/mission.repository';
import { ExecutionService } from './services/execution/execution.service';
import { SandboxService } from './services/sandbox/sandbox.service';
import { FingerprintValidator } from './strategies/fingerprint-validator';
import { SqlSecurityService } from './services/sql-security/sql-security.service';

@Injectable()
export class GameService {
  constructor(
    private readonly missionRepo: MissionRepository,
    private readonly sandbox: SandboxService,
    private readonly execution: ExecutionService,
    private readonly validator: FingerprintValidator,
    private readonly security: SqlSecurityService,
  ) {}

  async testQuery(userId: string, missionId: number, userQuery: string) {
    this.security.validateQuery(userQuery);
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) throw new BadRequestException('Missão não encontrada.');

    // Criamos um sufixo único para evitar colisões entre Teste e Submit simultâneos
    const executionId = `${userId}_test_${Date.now()}`;
    let schemaName: string | undefined;

    try {
      schemaName = await this.sandbox.prepareEnvironment(
        executionId,
        mission.sqlSetup,
      );

      const data = await this.execution.executePreview(schemaName, userQuery);

      return { success: true, mode: 'test', data };
    } finally {
      if (schemaName) {
        await this.sandbox.cleanup(executionId);
      }
    }
  }

  async submitAttempt(userId: string, missionId: number, userQuery: string) {
    this.security.validateQuery(userQuery);
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) throw new BadRequestException('Missão não encontrada.');

    const executionId = `${userId}_sub_${Date.now()}`;
    let schemaName: string | undefined;

    try {
      schemaName = await this.sandbox.prepareEnvironment(
        executionId,
        mission.sqlSetup,
      );

      const { userData, expectedData } = await this.execution.executeChallenge(
        schemaName,
        userQuery,
        mission.sqlValidation,
      );

      const result = this.validator.validate(userData, expectedData);
      return { ...result, mode: 'submission', data: userData };
    } finally {
      if (schemaName) {
        await this.sandbox.cleanup(executionId);
      }
    }
  }

  async getMissionContext(missionId: number) {
    // 1. Busca a missão
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) throw new BadRequestException('Missão não encontrada.');

    // Usamos um ID temporário apenas para leitura (não é o ID real do usuário)
    const tempId = `viewer_${Date.now()}`;

    try {
      // 2. Cria o palco temporariamente
      const schema = await this.sandbox.prepareEnvironment(
        tempId,
        mission.sqlSetup,
      );

      // 3. Espiona o palco (Admin olha o que foi criado)
      const tablesData = await this.sandbox.inspectSchema(schema);

      return {
        title: mission.title,
        briefing: mission.briefing,
        database: tablesData, // Aqui vai a estrutura completa para o Frontend
      };
    } finally {
      // 4. Destrói tudo imediatamente. Segurança máxima.
      await this.sandbox.cleanup(tempId);
    }
  }
}
