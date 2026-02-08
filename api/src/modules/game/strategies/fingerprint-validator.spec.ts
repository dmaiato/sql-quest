import { Test, TestingModule } from '@nestjs/testing';
import { FingerprintValidator } from './fingerprint-validator';

describe('FingerprintValidator', () => {
  let provider: FingerprintValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FingerprintValidator],
    }).compile();

    provider = module.get<FingerprintValidator>(FingerprintValidator);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
