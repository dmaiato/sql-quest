import { Test, TestingModule } from '@nestjs/testing';
import { MissionValidator } from './mission-validator';

describe('MissionValidator', () => {
  let provider: MissionValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MissionValidator],
    }).compile();

    provider = module.get<MissionValidator>(MissionValidator);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
