import type { DynamicModule }            from '@nestjs/common'
import type { OnModuleInit }             from '@nestjs/common'

import { Module }                        from '@nestjs/common'
import { MikroOrmModule }                from '@mikro-orm/nestjs'
import { MikroORM }                      from '@mikro-orm/core'
import { ConfigModule }                  from '@nestjs/config'
import { ConfigService }                 from '@nestjs/config'
import { CqrsModule }                    from '@nestjs/cqrs'
import { MikroORMRequestContextModule }  from '@monstrs/nestjs-mikro-orm-request-context'
import { PostgreSqlDriver }              from '@mikro-orm/postgresql'
import { MikroORMConfigModule }          from '@monstrs/nestjs-mikro-orm-config'
import { MikroORMConfig }                from '@monstrs/nestjs-mikro-orm-config'
import { ValidationModule }              from '@monstrs/nestjs-validation'
import { S3ClientModule }                from '@monstrs/nestjs-s3-client'
import { S3ClientFactory }               from '@monstrs/nestjs-s3-client'
import { GoogleStorageModule }           from '@monstrs/nestjs-google-storage'
import { GoogleStorageFactory }          from '@monstrs/nestjs-google-storage'
import { ServerBufConnect }              from '@wolfcoded/nestjs-bufconnect'
import { ServerProtocol }                from '@wolfcoded/nestjs-bufconnect'
import { MicroservisesRegistryModule }   from '@monstrs/nestjs-microservices-registry'

import { UploadRepository }              from '@files-system/domain-module'
import { FileRepository }                from '@files-system/domain-module'
import { FilesBucketsAdapter }           from '@files-system/domain-module'
import { FilesStorageAdapter }           from '@files-system/domain-module'

import * as configurations               from '../config/index.js'
import * as entities                     from '../entities/index.js'
import * as migrations                   from '../migrations/index.js'
import * as controllers                  from '../controllers/index.js'
import * as mappers                      from '../mappers/index.js'
import { UploadRepositoryImpl }          from '../repositories/index.js'
import { FileRepositoryImpl }            from '../repositories/index.js'
import { S3FilesStorageAdapterImpl }     from '../ports/index.js'
import { GoogleFilesStorageAdapterImpl } from '../ports/index.js'
import { EnvFilesBucketsAdapterImpl }    from '../ports/index.js'

@Module({})
export class FilesSystemInfrastructureModule implements OnModuleInit {
  constructor(private readonly orm: MikroORM) {}

  static register(): DynamicModule {
    const providers = [
      {
        provide: FilesStorageAdapter,
        useFactory: (
          configService: ConfigService,
          s3ClientFactory: S3ClientFactory,
          googleStorageFactory: GoogleStorageFactory
        ): FilesStorageAdapter =>
          configService.get('storage.type') === 's3'
            ? new S3FilesStorageAdapterImpl(s3ClientFactory.create())
            : new GoogleFilesStorageAdapterImpl(googleStorageFactory.create()),
        inject: [ConfigService, S3ClientFactory, GoogleStorageFactory],
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
          strategy: new ServerBufConnect({
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
        GoogleStorageModule.register(),
        ValidationModule.register(),
        S3ClientModule.register(),
        ConfigModule.forRoot({
          load: Object.values(configurations),
        }),
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
