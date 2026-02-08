import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PlayerConnection implements OnModuleDestroy {
  private dataSource: DataSource;

  constructor(private configService: ConfigService) {}

  async getDataSource(): Promise<DataSource> {
    // Se a conexão já existe e está viva, retorna ela
    if (this.dataSource?.isInitialized) {
      return this.dataSource;
    }

    // Se não, cria uma nova (Lazy Loading)
    this.dataSource = new DataSource({
      type: 'postgres',
      url: this.configService.get('DATABASE_PLAYER_URL'),
      synchronize: false,
      logging: false,
    });

    await this.dataSource.initialize();
    return this.dataSource;
  }

  async onModuleDestroy() {
    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }
  }
}
