import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

console.log(
  'URL de Conexão Admin:',
  process.env.DATABASE_ADMIN_URL ? 'Carregada ✅' : 'Não encontrada ❌',
);

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_ADMIN_URL,

  // Ajuste o caminho das entidades dependendo de como você está rodando (ts-node vs build)
  // Para desenvolvimento local com ts-node, aponte para .ts
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],

  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],

  migrationsRun: true,
  synchronize: false,
});
