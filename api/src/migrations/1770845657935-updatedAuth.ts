import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatedAuth1770845657935 implements MigrationInterface {
  name = 'UpdatedAuth1770845657935';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "mission_progress" ("id" SERIAL NOT NULL, "missionId" integer NOT NULL, "status" character varying NOT NULL DEFAULT 'COMPLETED', "earnedXp" integer NOT NULL, "completedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "UQ_1d8369266fedf5d703332915aaf" UNIQUE ("userId", "missionId"), CONSTRAINT "PK_0667484709439992c15dcbae23f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3538c7327f94a3fd8ea0b855ea" ON "mission_progress" ("missionId") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "password" character varying NOT NULL, "nickname" character varying NOT NULL, "totalXp" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "missions" ("id" SERIAL NOT NULL, "title" character varying(100) NOT NULL, "briefing" text NOT NULL, "difficulty" character varying(20) NOT NULL, "sql_setup" text NOT NULL, "sql_validation" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_787aebb1ac5923c9904043c6309" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "mission_progress" ADD CONSTRAINT "FK_c0d3d5ef8dd1adbc58ee8bb218f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(`
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
    await queryRunner.query(
      `ALTER TABLE "mission_progress" DROP CONSTRAINT "FK_c0d3d5ef8dd1adbc58ee8bb218f"`,
    );
    await queryRunner.query(`DROP TABLE "missions"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3538c7327f94a3fd8ea0b855ea"`,
    );
    await queryRunner.query(`DROP TABLE "mission_progress"`);
  }
}
