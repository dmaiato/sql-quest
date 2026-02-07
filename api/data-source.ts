import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Força o carregamento do .env que está na raiz do projeto
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Debug: Vamos verificar se ele leu a variável (Isso vai aparecer no seu terminal)
// Se aparecer "undefined", sabemos que o caminho do arquivo está errado.
console.log(
  'URL de Conexão Admin:',
  process.env.DATABASE_ADMIN_URL ? 'Carregada ✅' : 'Não encontrada ❌',
);

export const AppDataSource = new DataSource({
  type: 'postgres',
  // Certifique-se que esta variável é EXATAMENTE a mesma do seu .env
  url: process.env.DATABASE_ADMIN_URL,

  // Ajuste o caminho das entidades dependendo de como você está rodando (ts-node vs build)
  // Para desenvolvimento local com ts-node, aponte para .ts
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],

  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],

  synchronize: false,
});
