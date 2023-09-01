import { Injectable }                from '@nestjs/common'

import { FilesBucket }               from '@files-system/domain-module'
import { FilesBucketsAdapter }       from '@files-system/domain-module'
import { FilesBucketType }           from '@files-system/domain-module'
import { FilesBucketSizeConditions } from '@files-system/domain-module'
import { FilesBucketConditions }     from '@files-system/domain-module'

@Injectable()
export class EnvFilesBucketsAdapterImpl extends FilesBucketsAdapter {
  static FILES_BUCKETS_ENV_PREFIX = 'FILES_BUCKETS'

  #buckets: Array<FilesBucket>

  constructor() {
    super()

    this.#buckets = EnvFilesBucketsAdapterImpl.getBuckets()
  }

  protected static getBuckets(): Array<FilesBucket> {
    return this.getAvailableBuckets().map((scope) => this.getBucketConfig(scope))
  }

  protected static getAvailableBuckets(): Array<string> {
    const bucketKeys: Array<string> = Object.keys(process.env).filter((key) =>
      key.startsWith(EnvFilesBucketsAdapterImpl.FILES_BUCKETS_ENV_PREFIX))

    return bucketKeys.reduce((result: Array<string>, key) => {
      const [scope] = key
        .replace(EnvFilesBucketsAdapterImpl.FILES_BUCKETS_ENV_PREFIX, '')
        .substr(1)
        .toLowerCase()
        .split('_')

      if (result.includes(scope)) {
        return result
      }

      return [...result, scope]
    }, [])
  }

  protected static getValueFromEnv(...args: Array<string>): string | undefined {
    const key = [EnvFilesBucketsAdapterImpl.FILES_BUCKETS_ENV_PREFIX, ...args]
      .join('_')
      .toUpperCase()

    return process.env[key]
  }

  protected static getBucketConditions(scope: string): FilesBucketConditions {
    const type = this.getValueFromEnv(scope, 'conditions', 'type')
    const min = Number(this.getValueFromEnv(scope, 'conditions', 'length', 'min'))
    const max = Number(this.getValueFromEnv(scope, 'conditions', 'length', 'max'))

    return FilesBucketConditions.create(type!, FilesBucketSizeConditions.create(min, max))
  }

  protected static getBucketConfig(scope: string): FilesBucket {
    const type =
      (this.getValueFromEnv(scope, 'type') || FilesBucketType.PRIVATE) === 'private'
        ? FilesBucketType.PRIVATE
        : FilesBucketType.PUBLIC
    const bucket = this.getValueFromEnv(scope, 'bucket')
    const path = this.getValueFromEnv(scope, 'path') || '/'

    return FilesBucket.create(type, scope, bucket!, path, this.getBucketConditions(scope))
  }

  override toFilesBucket(name: string): FilesBucket | undefined {
    return this.#buckets.find((bucket) => bucket.name === name)
  }
}
