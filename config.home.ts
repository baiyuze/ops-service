const isProduction = process.env.NODE_ENV === 'production';
export const mysqlConfig = {
  type: 'mysql',
  // host: '192.168.2.205',
  host: 'data.sanyang.life',
  allowPublicKeyRetrieval: true,
  useSSL: false,
  // port: 3306,
  port: 3307,
  username: 'user',
  password: 'mysqlpassword666',
  database: isProduction ? 'front_resource' : 'front_resource_test',
  timezone: 'Z', //设置时区
  entities: isProduction
    ? ['/app/**/*.entity{.ts,.js}']
    : ['dist/**/*.entity{.ts,.js}'],
  synchronize: isProduction ? false : true,
};

export const staticDir = 'resources/assets/files';
