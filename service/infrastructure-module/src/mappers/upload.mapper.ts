import type { ExtractProperties }    from '@monstrs/base-types'

import type { UploadEntity }         from '../entities/index.js'

import { Injectable }                from '@nestjs/common'

import { FilesBucketSizeConditions } from '@files-system/domain-module'
import { FilesBucketConditions }     from '@files-system/domain-module'
import { FilesBucket }               from '@files-system/domain-module'
import { Upload }                    from '@files-system/domain-module'

@Injectable()
export class UploadMapper {
  toDomain(entity: UploadEntity): Upload {
    const bucketSizeConditionsProperties: ExtractProperties<FilesBucketSizeConditions> = {
      min: entity.bucket.conditions.size.min,
      max: entity.bucket.conditions.size.max,
    }

    const bucketConditionsProperties: ExtractProperties<FilesBucketConditions> = {
      type: entity.bucket.conditions.type,
      size: Object.assign(new FilesBucketSizeConditions(), bucketSizeConditionsProperties),
    }

    const bucketProperties: ExtractProperties<FilesBucket> = {
      type: entity.bucket.type,
      name: entity.bucket.name,
      bucket: entity.bucket.bucket,
      path: entity.bucket.path,
      conditions: Object.assign(new FilesBucketConditions(), bucketConditionsProperties),
    }

    const properties: Omit<ExtractProperties<Upload>, 'autoCommit'> = {
      id: entity.id,
      ownerId: entity.ownerId,
      filename: entity.filename,
      contentType: entity.contentType,
      name: entity.name,
      size: entity.size,
      url: entity.url,
      confirmed: entity.confirmed,
      bucket: Object.assign(new FilesBucket(), bucketProperties),
    }

    return Object.assign(new Upload(), properties)
  }

  toPersistence(aggregate: Upload, entity: UploadEntity): UploadEntity {
    entity.assign({
      id: aggregate.id,
      ownerId: aggregate.ownerId,
      url: aggregate.url,
      name: aggregate.name,
      filename: aggregate.filename,
      contentType: aggregate.contentType,
      size: aggregate.size,
      confirmed: aggregate.confirmed,
      bucket: {
        type: aggregate.bucket.type,
        name: aggregate.bucket.name,
        bucket: aggregate.bucket.bucket,
        path: aggregate.bucket.path,
        conditions: {
          type: aggregate.bucket.conditions.type,
          size: {
            min: aggregate.bucket.conditions.size.min,
            max: aggregate.bucket.conditions.size.max,
          },
        },
      },
    })

    return entity
  }
}
