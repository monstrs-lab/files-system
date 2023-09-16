import type { MikroOrmModuleOptions }        from '@mikro-orm/nestjs'
import type { CqrsKafkaEventsModuleOptions } from '@monstrs/nestjs-cqrs-kafka-events'
import type { GcsClientModuleOptions }       from '@monstrs/nestjs-gcs-client'
import type { S3ClientModuleOptions }        from '@monstrs/nestjs-s3-client'

export interface FilesSystemInfrastructureModuleOptions {
  storage?: 'gcs' | 's3'
  events?: CqrsKafkaEventsModuleOptions
  gcs?: GcsClientModuleOptions
  s3?: S3ClientModuleOptions
  db?: Partial<MikroOrmModuleOptions>
}
