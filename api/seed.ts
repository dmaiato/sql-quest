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

  const missions: Mission[] = [];

  const m1 = new Mission();
  m1.title = 'Operação Olhos de Águia';
  m1.briefing = 'Recupere o nome de todos os agentes.';
  m1.difficulty = 'Easy';
  m1.sqlSetup = `
    CREATE TABLE agents (id SERIAL, codename TEXT, status TEXT);
    INSERT INTO agents (codename, status) VALUES ('007', 'Active'), ('Bourne', 'Unknown');
  `;
  m1.sqlValidation = 'SELECT codename FROM agents';

  missions.push(m1);

  const m2 = new Mission();
  m2.title = 'O Chef Esquecido';
  m2.briefing =
    'O Chef do renomado restaurante SQL Gourmet perdeu a lista de ingredientes que precisam ser comprados hoje. Ele só compra ingredientes que estão com estoque abaixo de 10 unidades e que não são perecíveis. Liste o nome desses ingredientes.';
  m2.difficulty = 'Easy';
  m2.sqlSetup = `
    CREATE TABLE despensa (
      id SERIAL PRIMARY KEY,
      item TEXT,
      quantidade INT,
      perecivel BOOLEAN
    );
    INSERT INTO despensa (item, quantidade, perecivel) VALUES 
    ('Arroz Arbóreo', 5, false),
    ('Leite Fresco', 3, true),
    ('Sal Marinho', 50, false),
    ('Pimenta do Reino', 2, false),
    ('Filé Mignon', 8, true);
  `;
  m2.sqlValidation =
    'SELECT item FROM despensa WHERE quantidade < 10 AND perecivel = false';

  missions.push(m2);

  const m3 = new Mission();
  m3.title = 'Sinais do Espaço';
  m3.briefing =
    "O radiotelescópio captou sinais de diversos quadrantes do universo. Precisamos identificar quais constelações enviaram mais de 2 sinais de 'Alta Intensidade'. Mostre o nome da constelação e a contagem de sinais.";
  m3.difficulty = 'Medium';
  m3.sqlSetup = `
    CREATE TABLE constelacoes (
      id SERIAL PRIMARY KEY,
      nome TEXT,
      distancia_anos_luz INT
    );
    CREATE TABLE sinais (
      id SERIAL PRIMARY KEY,
      constelacao_id INT,
      intensidade TEXT, -- 'Baixa', 'Média', 'Alta'
      frequencia DECIMAL
    );
    INSERT INTO constelacoes (nome, distancia_anos_luz) VALUES ('Órion', 1344), ('Lira', 25), ('Cisne', 2000);
    INSERT INTO sinais (constelacao_id, intensidade, frequencia) VALUES 
    (1, 'Alta', 1420.4), (1, 'Alta', 1420.5), (1, 'Alta', 1420.9),
    (2, 'Baixa', 100.1), (2, 'Alta', 1420.1),
    (3, 'Alta', 1500.0), (3, 'Alta', 1500.1);
  `;
  m3.sqlValidation =
    "SELECT c.nome, COUNT(s.id) as total_sinais FROM constelacoes c JOIN sinais s ON c.id = s.constelacao_id WHERE s.intensidade = 'Alta' GROUP BY c.nome HAVING COUNT(s.id) > 2";

  missions.push(m3);

  await repo.save(missions);
  console.log('Seed executado com sucesso!');
  process.exit();
}

run();
