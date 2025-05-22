
interface MysqlConfig {
  type: string
  host: string
  port: string | number
  username: string
  password: string
  database: string
  entities: string[]
  synchronize: boolean
}
