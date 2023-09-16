import type { MikroOrmModuleOptions }                  from '@mikro-orm/nestjs'
import type { DynamicModule }                          from '@nestjs/common'
import type { OnModuleInit }                           from '@nestjs/common'

import type { FilesSystemInfrastructureModuleOptions } from './files-system-infrastructure.module.interfaces.js'

import { MikroORM }                                    from '@mikro-orm/core'
import { MikroOrmModule }                              from '@mikro-orm/nestjs'
import { PostgreSqlDriver }                            from '@mikro-orm/postgresql'
import { ConnectRpcServer }                            from '@monstrs/nestjs-connectrpc'
import { ServerProtocol }                              from '@monstrs/nestjs-connectrpc'
import { CqrsModule }                                  from '@monstrs/nestjs-cqrs'
import { CqrsKafkaEventsModule }                       from '@monstrs/nestjs-cqrs-kafka-events'
import { GcsClientModule }                             from '@monstrs/nestjs-gcs-client'
import { GcsClientFactory }                            from '@monstrs/nestjs-gcs-client'
import { MicroservisesRegistryModule }                 from '@monstrs/nestjs-microservices-registry'
import { MikroORMConfigModule }                        from '@monstrs/nestjs-mikro-orm-config'
import { MikroORMConfig }                              from '@monstrs/nestjs-mikro-orm-config'
import { MikroORMRequestContextModule }                from '@monstrs/nestjs-mikro-orm-request-context'
import { S3ClientModule }                              from '@monstrs/nestjs-s3-client'
import { S3ClientFactory }                             from '@monstrs/nestjs-s3-client'
import { ValidationModule }                            from '@monstrs/nestjs-validation'
import { Module }                                      from '@nestjs/common'

import { TransactionalRepository }                     from '@files-system/domain-module'
import { UploadRepository }                            from '@files-system/domain-module'
import { FileRepository }                              from '@files-system/domain-module'
import { FilesBucketsAdapter }                         from '@files-system/domain-module'
import { FilesStorageAdapter }                         from '@files-system/domain-module'

import * as controllers                                from '../controllers/index.js'
import * as entities                                   from '../entities/index.js'
import * as mappers                                    from '../mappers/index.js'
import * as migrations                                 from '../migrations/index.js'
import { S3FilesStorageAdapterImpl }                   from '../ports/index.js'
import { GcsFilesStorageAdapterImpl }                  from '../ports/index.js'
import { EnvFilesBucketsAdapterImpl }                  from '../ports/index.js'
import { TransactionalRepositoryImpl }                 from '../repositories/index.js'
import { UploadRepositoryImpl }                        from '../repositories/index.js'
import { FileRepositoryImpl }                          from '../repositories/index.js'
import { FilesSystemInfrastructureModuleConfig }       from './files-system-infrastructure.module.config.js'
import { FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS }  from './files-system-infrastructure.module.contants.js'

@Module({})
export class FilesSystemInfrastructureModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  static register(options: FilesSystemInfrastructureModuleOptions = {}): DynamicModule {
    const providers = [
      {
        provide: FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS,
        useValue: options,
      },
      {
        provide: FilesSystemInfrastructureModuleConfig,
        useClass: FilesSystemInfrastructureModuleConfig,
      },
      {
        provide: FilesStorageAdapter,
        useFactory: (
          config: FilesSystemInfrastructureModuleConfig,
          s3ClientFactory: S3ClientFactory,
          googleStorageFactory: GcsClientFactory
        ): FilesStorageAdapter =>
          config.storage === 'gcs'
            ? new GcsFilesStorageAdapterImpl(googleStorageFactory.create())
            : new S3FilesStorageAdapterImpl(s3ClientFactory.create()),
        inject: [FilesSystemInfrastructureModuleConfig, S3ClientFactory, GcsClientFactory],
      },
      {
        provide: FilesBucketsAdapter,
        useClass: EnvFilesBucketsAdapterImpl,
      },
      {
        provide: TransactionalRepository,
        useClass: TransactionalRepositoryImpl,
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
        MikroORMRequestContextModule.forInterceptor(),
        MicroservisesRegistryModule.connect({
          strategy: new ConnectRpcServer({
            protocol: ServerProtocol.HTTP2_INSECURE,
            port: 50051,
          }),
        }),
        ValidationModule.register(),
        CqrsModule.forRoot(),
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
          useFactory: (mikroORMConfig: MikroORMConfig, config): MikroOrmModuleOptions =>
            ({
              ...mikroORMConfig.createMikroOrmOptions(),
              ...config.db,
            }) as MikroOrmModuleOptions,
          inject: [MikroORMConfig, FilesSystemInfrastructureModuleConfig],
        }),
        CqrsKafkaEventsModule.registerAsync({
          useFactory: (config: FilesSystemInfrastructureModuleConfig) => config.events,
          inject: [FilesSystemInfrastructureModuleConfig],
        }),
        GcsClientModule.registerAsync({
          useFactory: (config: FilesSystemInfrastructureModuleConfig) => config.gcs,
          inject: [FilesSystemInfrastructureModuleConfig],
        }),
        S3ClientModule.registerAsync({
          useFactory: (config: FilesSystemInfrastructureModuleConfig) => config.s3,
          inject: [FilesSystemInfrastructureModuleConfig],
        }),
      ],
      providers: [...Object.values(mappers), ...providers],
      exports: [...providers],
    }
  }

  async onModuleInit(): Promise<void> {
    await this.orm.getMigrator().up()
  }
}
