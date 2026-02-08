import { Test, TestingModule } from '@nestjs/testing';
import { PlayerConnection } from './player-connection';

describe('PlayerConnection', () => {
  let provider: PlayerConnection;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlayerConnection],
    }).compile();

    provider = module.get<PlayerConnection>(PlayerConnection);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
});
