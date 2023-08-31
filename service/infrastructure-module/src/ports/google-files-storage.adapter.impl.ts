import type { Upload }         from '@files-system/domain-module'

import { join }                from 'node:path'
import { relative }            from 'node:path'

import { Injectable }          from '@nestjs/common'
import { Storage }             from '@monstrs/nestjs-google-storage'

import { FilesStorageAdapter } from '@files-system/domain-module'

@Injectable()
export class GoogleFilesStorageAdapterImpl extends FilesStorageAdapter {
  constructor(private readonly storage: Storage) {
    super()
  }

  override async prepareUpload(upload: Upload): Promise<string> {
    const filename = upload.bucket.path.startsWith('/')
      ? relative('/', join(upload.bucket.path, upload.filename))
      : join(upload.bucket.path, upload.filename)

    const [url] = await this.storage
      .bucket(upload.bucket.bucket)
      .file(filename)
      .createResumableUpload({
        metadata: { contentLength: upload.size, contentType: upload.contentType },
      })

    return url
  }
}
