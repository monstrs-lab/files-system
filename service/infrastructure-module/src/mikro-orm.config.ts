import { PostgreSqlDriver }      from '@mikro-orm/postgresql'
import { MikroORMConfigBuilder } from '@monstrs/nestjs-mikro-orm-config'

import * as entities             from './entities/index.js'
import * as migrations           from './migrations/index.js'

export default MikroORMConfigBuilder.build({
  type: 'postgresql',
  driver: PostgreSqlDriver,
  entities: Object.values(entities),
  migrations: {
    tableName: 'mikro_orm_migrations_files_system',
    disableForeignKeys: false,
    migrationsList: Object.keys(migrations).map((name: string) => ({
      class: migrations[name as keyof typeof migrations],
      name,
    })),
    pathTs: './src/migrations',
    emit: 'ts',
  },
})
