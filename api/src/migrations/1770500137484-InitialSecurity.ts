import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSecurity1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Criar Tabela de Missões (DDL manual ou gerado)
    await queryRunner.query(`
            CREATE TABLE "missions" (
                "id" SERIAL NOT NULL,
                "title" character varying(100) NOT NULL,
                "briefing" text NOT NULL,
                "difficulty" character varying(20) NOT NULL,
                "sql_setup" text NOT NULL,
                "sql_validation" text NOT NULL,
                "expected_result" jsonb NOT NULL,
                "created_at" TIMESTAMP DEFAULT now(),
                CONSTRAINT "PK_missions" PRIMARY KEY ("id")
            )
        `);

    // 2. Segurança: Criar Roles e Funcões
    await queryRunner.query(`
            -- Criar Role Restrita (se não existir)
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'player_restricted') THEN
                CREATE ROLE player_restricted WITH LOGIN PASSWORD 'senha_jogador_123';
              END IF;
            END $$;

            -- Bloquear Public
            REVOKE ALL ON SCHEMA public FROM PUBLIC;
            ALTER ROLE player_restricted SET statement_timeout = '5000'; -- 5s timeout

            -- Função de Sandbox
            CREATE OR REPLACE FUNCTION setup_user_sandbox(target_user_id TEXT) 
            RETURNS VOID AS $$
            DECLARE
                schema_name TEXT;
            BEGIN
                schema_name := 'play_' || replace(target_user_id, '-', '_');
                
                -- 1. DESTRUIÇÃO TOTAL (O segredo do Reset)
                -- Remove o schema e tudo dentro dele (tabelas, dados, etc)
                EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', schema_name);
                
                -- 2. RECONSTRUÇÃO
                EXECUTE format('CREATE SCHEMA %I', schema_name);
                
                -- 3. PERMISSÕES (Mesma lógica de antes)
                EXECUTE format('REVOKE ALL ON SCHEMA %I FROM PUBLIC', schema_name);
                EXECUTE format('GRANT USAGE ON SCHEMA %I TO player_restricted', schema_name);
                EXECUTE format('ALTER DEFAULT PRIVILEGES IN SCHEMA %I GRANT ALL ON TABLES TO player_restricted', schema_name);
                
                -- Garante que o player não fuja para o public
                REVOKE ALL ON SCHEMA public FROM player_restricted;
            END;
            $$ LANGUAGE plpgsql;
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "missions"`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS setup_user_sandbox`);
    // Não removemos roles em rollback por segurança
  }
}
