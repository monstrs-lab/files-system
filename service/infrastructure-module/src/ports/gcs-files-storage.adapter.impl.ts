import type { Upload }         from '@files-system/domain-module'
import type { File }           from '@files-system/domain-module'

import { join }                from 'node:path'
import { relative }            from 'node:path'

import { Logger }              from '@monstrs/logger'
import { Storage }             from '@monstrs/nestjs-gcs-client'
import { Injectable }          from '@nestjs/common'

import { FilesStorageAdapter } from '@files-system/domain-module'
import { StorageFileMetadata } from '@files-system/domain-module'

@Injectable()
export class GcsFilesStorageAdapterImpl extends FilesStorageAdapter {
  #logger = new Logger(GcsFilesStorageAdapterImpl.name)

  constructor(private readonly storage: Storage) {
    super()
  }

  override async generateReadUrl(file: File): Promise<string | undefined> {
    const [signedUrl] = await this.storage
      .bucket(file.bucket)
      .file(new URL(file.url).pathname)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 10 * 60 * 1000,
      })

    return signedUrl
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

  override async toFileMetadata(upload: Upload): Promise<StorageFileMetadata | undefined> {
    const filename = upload.bucket.path.startsWith('/')
      ? relative('/', join(upload.bucket.path, upload.filename))
      : join(upload.bucket.path, upload.filename)

    try {
      const [metadata] = await this.storage
        .bucket(upload.bucket.bucket)
        .file(filename)
        .getMetadata()

      const [signedUrl] = await this.storage
        .bucket(upload.bucket.bucket)
        .file(filename)
        .getSignedUrl({
          version: 'v4',
          action: 'read',
          expires: Date.now() + 10 * 60 * 1000,
        })

      const size =
        typeof metadata.size === 'string' ? Number.parseInt(metadata.size, 10) : metadata.size

      const url =
        this.storage.apiEndpoint !== 'https://storage.googleapis.com'
          ? signedUrl.replace('https://storage.googleapis.com', this.storage.apiEndpoint)
          : signedUrl

      return StorageFileMetadata.create(
        Object.assign(new URL(url), { search: '' }).toString(),
        size || upload.size,
        metadata.contentType || upload.contentType
      )
    } catch (error) {
      if (error instanceof Error) {
        if ((error as any).code !== 404) {
          this.#logger.error(error)
        }
      }

      return undefined
    }
  }
}
