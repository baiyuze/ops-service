const isProduction = process.env.NODE_ENV === 'production';
export const mysqlConfig = {
  type: 'mysql',
  host: '192.168.1.1',
  allowPublicKeyRetrieval: true,
  useSSL: false,
  port: 3306,
  username: 'dev',
  password: '123456',
  database: isProduction ? 'front_resource' : 'front_resource_test',
  timezone: 'Z', //设置时区
  entities: isProduction
    ? ['src/**/*.entity{.ts,.js}']
    : ['dist/**/*.entity{.ts,.js}'],
  logging: isProduction
    ? ['error'] // 生产环境只记录错误
    : ['query', 'error', 'warn'], // 开发环境记录查询、错误、警告
  // synchronize: isProduction ? false : true,
  synchronize: true,
  logger: isProduction ? 'file' : 'info',
};

export const staticDir = 'resources/assets/files';
