import { Test, TestingModule } from '@nestjs/testing';
import { MissionRepository } from './mission.repository';

describe('MissionRepository', () => {
  let provider: MissionRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MissionRepository],
    }).compile();

    provider = module.get<MissionRepository>(MissionRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
