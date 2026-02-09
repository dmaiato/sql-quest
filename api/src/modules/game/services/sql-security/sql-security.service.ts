import { Injectable, BadRequestException, Logger } from '@nestjs/common';

@Injectable()
export class SqlSecurityService {
  private readonly logger = new Logger(SqlSecurityService.name);

  // 1. Bloqueia comandos de escrita e DDL
  private readonly DML_DDL_REGEX =
    /\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|GRANT|REVOKE|COMMIT|ROLLBACK|REPLACE|CALL|EXEC|MERGE|LOCK|PRAGMA|SET|SHOW)\b/i;

  // 2. Bloqueia acesso a schemas de sistema, tabelas de catalogo e funções de arquivo
  private readonly SYSTEM_ACCESS_REGEX =
    /\b(information_schema|pg_catalog|pg_class|pg_attribute|pg_proc|pg_user|pg_shadow|pg_auth|pg_read_file|pg_ls_dir|current_database|current_user|version)\b/i;

  // 3. Bloqueia ataques de heavy load (Carga/DoS)
  private readonly HEAVY_LOAD_REGEX =
    /\b(pg_sleep|generate_series|repeat|xmltable|json_each|unnest)\b/i;

  validateQuery(query: string): string {
    if (!query) throw new BadRequestException('A query não pode estar vazia.');
    const cleanQuery = query.trim();

    // Validação 1: Comandos Proibidos
    if (this.DML_DDL_REGEX.test(cleanQuery)) {
      throw new BadRequestException(
        'Segurança: Operação proibida. Apenas leituras (SELECT) são permitidas.',
      );
    }

    // Validação 2: Acesso ao Sistema
    if (this.SYSTEM_ACCESS_REGEX.test(cleanQuery)) {
      this.logger.warn(`Tentativa de System Access bloqueada: ${cleanQuery}`);
      throw new BadRequestException(
        'Segurança: O acesso a tabelas de sistema ou metadados do banco é bloqueado.',
      );
    }

    // Validação 3: Carga Pesada
    if (this.HEAVY_LOAD_REGEX.test(cleanQuery)) {
      this.logger.warn(`Tentativa de Heavy Load bloqueada: ${cleanQuery}`);
      throw new BadRequestException(
        'Segurança: Funções geradoras de carga ou delay são proibidas.',
      );
    }

    // Validação 4: Stacked Queries
    this.checkForStackedQueries(cleanQuery);

    return cleanQuery;
  }

  private checkForStackedQueries(query: string): void {
    const skeleton = query.replace(/'([^'\\]|\\.)*'/g, "''");
    // Detecta ; seguido de texto útil
    if (/;[ \t\r\n]*[^ \t\r\n;]/s.test(skeleton)) {
      throw new BadRequestException(
        'Segurança: Múltiplas queries não são permitidas.',
      );
    }
  }
}
