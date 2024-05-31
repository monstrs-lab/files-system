import type { MikroOrmModuleOptions }                  from '@mikro-orm/nestjs'
import type { CqrsKafkaEventsModuleOptions }           from '@monstrs/nestjs-cqrs-kafka-events'
import type { GcsClientModuleOptions }                 from '@monstrs/nestjs-gcs-client'
import type { S3ClientModuleOptions }                  from '@monstrs/nestjs-s3-client'

import type { FilesSystemInfrastructureModuleOptions } from './files-system-infrastructure.module.interfaces.js'

import { Inject }                                      from '@nestjs/common'

import { FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS }  from './files-system-infrastructure.module.contants.js'

export class FilesSystemInfrastructureModuleConfig {
  constructor(
    @Inject(FILES_SYSTEM_INFRASTRUCTURE_MODULE_OPTIONS)
    private readonly options: FilesSystemInfrastructureModuleOptions
  ) {}

  get storage(): FilesSystemInfrastructureModuleOptions['storage'] {
    return (
      this.options.storage ||
      (process.env.FILES_STORAGE_PROVIDER as FilesSystemInfrastructureModuleOptions['storage']) ||
      's3'
    )
  }

  get events(): CqrsKafkaEventsModuleOptions {
    return this.options.events || {}
  }

  get gcs(): GcsClientModuleOptions {
    return this.options.gcs || {}
  }

  get s3(): S3ClientModuleOptions {
    return this.options.s3 || {}
  }

  get db(): Partial<MikroOrmModuleOptions> {
    return this.options.db || {}
  }
}
