import type { DynamicModule }                          from '@nestjs/common'
import type { OnModuleInit }                           from '@nestjs/common'

import type { FilesSystemInfrastructureModuleOptions } from './files-system-infrastructure.module.interfaces.js'

import { Module }                                      from '@nestjs/common'
import { MikroOrmModule }                              from '@mikro-orm/nestjs'
import { MikroORM }                                    from '@mikro-orm/core'
import { CqrsModule }                                  from '@nestjs/cqrs'
import { MikroORMRequestContextModule }                from '@monstrs/nestjs-mikro-orm-request-context'
import { PostgreSqlDriver }                            from '@mikro-orm/postgresql'
import { MikroORMConfigModule }                        from '@monstrs/nestjs-mikro-orm-config'
import { MikroORMConfig }                              from '@monstrs/nestjs-mikro-orm-config'
import { ValidationModule }                            from '@monstrs/nestjs-validation'
import { S3ClientModule }                              from '@monstrs/nestjs-s3-client'
import { S3ClientFactory }                             from '@monstrs/nestjs-s3-client'
import { GcsClientModule }                             from '@monstrs/nestjs-gcs-client'
import { GcsClientFactory }                            from '@monstrs/nestjs-gcs-client'
import { ConnectRpcServer }                            from '@monstrs/nestjs-connectrpc'
import { ServerProtocol }                              from '@monstrs/nestjs-connectrpc'
import { MicroservisesRegistryModule }                 from '@monstrs/nestjs-microservices-registry'

import { UploadRepository }                            from '@files-system/domain-module'
import { FileRepository }                              from '@files-system/domain-module'
import { FilesBucketsAdapter }                         from '@files-system/domain-module'
import { FilesStorageAdapter }                         from '@files-system/domain-module'

import * as entities                                   from '../entities/index.js'
import * as migrations                                 from '../migrations/index.js'
import * as controllers                                from '../controllers/index.js'
import * as mappers                                    from '../mappers/index.js'
import { UploadRepositoryImpl }                        from '../repositories/index.js'
import { FileRepositoryImpl }                          from '../repositories/index.js'
import { S3FilesStorageAdapterImpl }                   from '../ports/index.js'
import { GcsFilesStorageAdapterImpl }                  from '../ports/index.js'
import { EnvFilesBucketsAdapterImpl }                  from '../ports/index.js'
import { FILES_STORAGE_PROVIDER }                      from './files-system-infrastructure.module.contants.js'

@Module({})
export class FilesSystemInfrastructureModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  static register(options?: FilesSystemInfrastructureModuleOptions): DynamicModule {
    const providers = [
      {
        provide: FILES_STORAGE_PROVIDER,
        useValue: options?.storage || process.env.FILES_STORAGE_PROVIDER,
      },
      {
        provide: FilesStorageAdapter,
        useFactory: (
          storage: FilesSystemInfrastructureModuleOptions['storage'],
          s3ClientFactory: S3ClientFactory,
          googleStorageFactory: GcsClientFactory
        ): FilesStorageAdapter =>
          storage === 'gcs'
            ? new GcsFilesStorageAdapterImpl(googleStorageFactory.create())
            : new S3FilesStorageAdapterImpl(s3ClientFactory.create()),
        inject: [FILES_STORAGE_PROVIDER, S3ClientFactory, GcsClientFactory],
      },
      {
        provide: FilesBucketsAdapter,
        useClass: EnvFilesBucketsAdapterImpl,
      },
      {
        provide: UploadRepository,
        useClass: UploadRepositoryImpl,
      },
      {
        provide: FileRepository,
        useClass: FileRepositoryImpl,
      },
    ]

    return {
      global: true,
      module: FilesSystemInfrastructureModule,
      controllers: Object.values(controllers),
      imports: [
        MicroservisesRegistryModule.connect({
          strategy: new ConnectRpcServer({
            protocol: ServerProtocol.HTTP2_INSECURE,
            port: 50051,
          }),
        }),
        MikroOrmModule.forFeature(Object.values(entities)),
        MikroOrmModule.forRootAsync({
          imports: [
            MikroORMConfigModule.register({
              driver: PostgreSqlDriver,
              migrationsList: migrations,
              migrationsTableName: 'mikro_orm_migrations_files_system',
              entities,
            }),
          ],
          useExisting: MikroORMConfig,
        }),
        MikroORMRequestContextModule.forInterceptor(),
        ValidationModule.register(),
        GcsClientModule.register(),
        S3ClientModule.register(),
        CqrsModule.forRoot(),
      ],
      providers: [...Object.values(mappers), ...providers],
      exports: [...providers],
    }
  }

  async onModuleInit(): Promise<void> {
    await this.orm.getMigrator().up()
  }
}
