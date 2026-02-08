import { Injectable } from '@nestjs/common';
import { IChallengeValidator } from 'src/modules/game/interfaces/validator.interface';

@Injectable()
export class FingerprintValidator implements IChallengeValidator {
  validate(userResult: any[], expectedResult: any[]) {
    const userFingerprint = this.createFingerprint(userResult);
    const expectedFingerprint = this.createFingerprint(expectedResult);

    const success = userFingerprint === expectedFingerprint;
    return {
      success,
      message: success ? 'Missão cumprida!' : 'Os dados não conferem.',
    };
  }

  private createFingerprint(data: any[]): string {
    if (!data || data.length === 0) return '[]';
    return JSON.stringify(
      data
        .map((row: Record<string, any>) =>
          Object.keys(row)
            .sort()
            .reduce((acc: Record<string, string>, key) => {
              acc[key.toLowerCase()] = String(row[key]).trim();
              return acc;
            }, {}),
        )
        .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
    );
  }
}
