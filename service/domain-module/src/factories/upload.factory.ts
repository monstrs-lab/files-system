import { Injectable }          from '@nestjs/common'

import { Upload }              from '../aggregates/index.js'
import { FilesStorageAdapter } from '../ports/index.js'
import { FilesBucketsAdapter } from '../ports/index.js'

@Injectable()
export class UploadFactory {
  constructor(
    private readonly buckets: FilesBucketsAdapter,
    private readonly storage: FilesStorageAdapter
  ) {}

  create(): Upload {
    return new Upload(this.buckets, this.storage)
  }
}
