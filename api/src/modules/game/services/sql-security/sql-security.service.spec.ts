import { Test, TestingModule } from '@nestjs/testing';
import { SqlSecurityService } from './sql-security.service';

describe('SqlSecurityService', () => {
  let service: SqlSecurityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SqlSecurityService],
    }).compile();

    service = module.get<SqlSecurityService>(SqlSecurityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
