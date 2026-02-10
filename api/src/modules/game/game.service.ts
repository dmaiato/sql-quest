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

  async submitAttempt(userId: string, missionId: number, userQuery: string) {
    this.security.validateQuery(userQuery);

    // 1. Busca os requisitos da missão
    const mission = await this.missionRepo.findById(missionId);
    if (!mission) throw new BadRequestException('Missão não encontrada.');

    try {
      // 2. Prepara
      const schema = await this.sandbox.prepareEnvironment(
        userId,
        mission.sqlSetup,
      );

      // 3. Executa
      const { userData, expectedData } = await this.execution.executeChallenge(
        schema,
        userQuery,
        mission.sqlValidation,
      );

      // 4. Valida e retorna o resultado
      const result = this.validator.validate(userData, expectedData);
      return {
        ...result,
        data: userData,
      };
    } finally {
      // 5. Destrói o ambiente após o uso
      await this.sandbox.cleanup(userId);
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
