import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SandboxService {
  constructor(private adminDS: DataSource) {}

  async prepareEnvironment(userId: string, setupSql: string): Promise<string> {
    const schemaName = `play_${userId.replace(/-/g, '_')}`;
    const queryRunner = this.adminDS.createQueryRunner();
    await queryRunner.connect();

    try {
      // Chama a função SQL que criamos na migration para garantir isolamento
      await queryRunner.query(`SELECT setup_user_sandbox($1)`, [userId]);
      await queryRunner.query(`SET search_path TO ${schemaName}, public`);
      await queryRunner.query(setupSql);
      return schemaName;
    } finally {
      await queryRunner.release();
    }
  }

  async cleanup(userId: string): Promise<void> {
    const schemaName = `play_${userId.replace(/-/g, '_')}`;
    const queryRunner = this.adminDS.createQueryRunner();
    await queryRunner.connect();

    try {
      // Deleta o schema e tudo dentro dele (tabelas, views, etc)
      await queryRunner.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
    } finally {
      await queryRunner.release();
    }
  }
}
