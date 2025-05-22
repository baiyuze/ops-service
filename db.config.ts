import { resolve } from 'path';
import { ConnectionOptions } from 'typeorm';

const dbConfig: ConnectionOptions = {
  type: 'mysql',
  host: '192.168.1.1',
  port: 3306,
  username: 'dev',
  password: '123456',
  database: 'front_resource',
  entities: [
    'src/entities/*.ts', // 对应的实体类位置
  ],
  migrations: [
    'src/migrations/**/*.ts', // 对应的迁移文件位置
  ],
  cli: {
    entitiesDir: 'src/entities', // 实体类的目录位置
    migrationsDir: 'src/migrations', // 迁移文件的目录位置
  },
};

export default dbConfig;
