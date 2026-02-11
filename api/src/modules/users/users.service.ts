import { Injectable, ConflictException } from '@nestjs/common';
import { User } from './entity/user.entity';
import { MissionProgress } from './entity/mission-progress.entity';
import { UsersRepository } from './repository/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    // @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async create(
    email: string,
    passHash: string,
    nickname: string,
  ): Promise<User> {
    try {
      const user = this.usersRepository.create({
        email,
        password: passHash,
        nickname,
      });
      return await this.usersRepository.save(user);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        (error as Record<string, any>).code === '23505'
      )
        throw new ConflictException('Email já cadastrado.');
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    return user || null;
  }

  /**
   * Salva progresso de forma transacional e atômica.
   * Se já completou, não faz nada (idempotente).
   */
  async saveProgress(
    userId: string,
    missionId: number,
    xp: number,
  ): Promise<void> {
    try {
      await this.usersRepository.manager.transaction(async (manager) => {
        const existing = await manager.findOne(MissionProgress, {
          where: { user: { id: userId }, missionId },
        });

        if (!existing) {
          // 1. Registra Missão
          const progress = new MissionProgress();
          progress.user = { id: userId } as User;
          progress.missionId = missionId;
          progress.earnedXp = xp;
          await manager.save(progress);

          // 2. Dá o XP ao usuário
          await manager.increment(User, { id: userId }, 'totalXp', xp);
        }
      });
    } catch (err) {
      console.error('Erro ao salvar progresso:', err);
    }
  }
}
