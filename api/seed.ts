// seed.ts
import { DataSource } from 'typeorm';
import { Mission } from './src/modules/mission/entity/mission.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_ADMIN_URL,
  entities: [Mission],
});

async function run() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Mission);

  const mission = new Mission();
  mission.title = 'Operação Olhos de Águia';
  mission.briefing = 'Recupere o nome de todos os agentes.';
  mission.difficulty = 'Easy';
  mission.sqlSetup = `
    CREATE TABLE agents (id SERIAL, codename TEXT, status TEXT);
    INSERT INTO agents (codename, status) VALUES ('007', 'Active'), ('Bourne', 'Unknown');
  `;
  mission.sqlValidation = 'SELECT codename FROM agents';
  mission.expectedResult = [{ codename: '007' }, { codename: 'Bourne' }];

  await repo.save(mission);
  console.log('Seed executado com sucesso!');
  process.exit();
}

run();
