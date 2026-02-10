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

  async inspectSchema(schemaName: string) {
    const queryRunner = this.adminDS.createQueryRunner();
    await queryRunner.connect();

    try {
      // 1. Descobrir as tabelas criadas no schema
      const tablesInfo = (await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
          AND table_type = 'BASE TABLE';
      `)) as Array<{ table_name: string }>;

      const catalog: Array<{
        tableName: string;
        columns: Array<{ name: string; type: string }>;
        rows: Array<Record<string, unknown>>;
      }> = [];

      // 2. Para cada tabela, buscar colunas e dados de exemplo
      for (const t of tablesInfo) {
        const tableName = t.table_name;

        // Pega as colunas
        const columns = (await queryRunner.query(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = '${schemaName}' AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `)) as Array<{ column_name: string; data_type: string }>;

        // Pega os dados (Limitado a 10 linhas para não pesar a requisição)
        const rows = (await queryRunner.query(`
          SELECT * FROM "${schemaName}"."${tableName}" LIMIT 10;
        `)) as Array<Record<string, unknown>>;

        catalog.push({
          tableName,
          columns: columns.map((c) => ({
            name: c.column_name,
            type: c.data_type,
          })),
          rows,
        });
      }

      return catalog;
    } finally {
      await queryRunner.release();
    }
  }
}
