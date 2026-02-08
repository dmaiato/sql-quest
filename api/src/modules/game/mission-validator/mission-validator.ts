import { Injectable } from '@nestjs/common';

@Injectable()
export class MissionValidator {
  /**
   * Compara dois arrays de objetos ignorando ordem de linhas e colunas.
   */
  validate(userResult: any[], expectedResult: any[]) {
    // 1. Normaliza os dois resultados
    const userFingerprint = this.createFingerprint(userResult);
    const expectedFingerprint = this.createFingerprint(expectedResult);

    // 2. Comparação binária simples
    const success = userFingerprint === expectedFingerprint;

    return {
      success,
      // Se falhar, damos uma mensagem genérica ou calculamos a diferença
      message: success
        ? 'Missão Cumprida! 🕵️‍♂️'
        : `Resultado incorreto. Esperado ${expectedResult.length} registros, recebido ${userResult.length}. Verifique os dados.`,
    };
  }

  private createFingerprint(data: any[]): string {
    if (!data || data.length === 0) return '[]';

    // Passo A: Padronizar cada objeto (linha)
    const normalizedRows = data.map((row: Record<string, unknown>) => {
      // Ordena as chaves do objeto alfabeticamente (id, name, status...)
      // Garante que {id:1, name:'A'} seja igual a {name:'A', id:1}
      return Object.keys(row)
        .sort()
        .reduce((obj: Record<string, unknown>, key) => {
          obj[key] = row[key];
          return obj;
        }, {});
    });

    // Passo B: Ordenar as linhas pelo conteúdo JSON
    // Garante que a ordem dos registros não importe
    normalizedRows.sort((a, b) => {
      return JSON.stringify(a).localeCompare(JSON.stringify(b));
    });

    // Passo C: Transformar tudo em uma string final
    return JSON.stringify(normalizedRows);
  }
}
