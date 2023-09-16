import type { Upload }         from '@files-system/domain-module'

import { join }                from 'node:path'
import { relative }            from 'node:path'

import { Logger }              from '@monstrs/logger'
import { S3Client }            from '@monstrs/nestjs-s3-client'
import { PutObjectCommand }    from '@monstrs/nestjs-s3-client'
import { HeadObjectCommand }   from '@monstrs/nestjs-s3-client'
import { GetObjectCommand }    from '@monstrs/nestjs-s3-client'
import { Injectable }          from '@nestjs/common'
import { getSignedUrl }        from '@monstrs/nestjs-s3-client'

import { FilesStorageAdapter } from '@files-system/domain-module'
import { StorageFileMetadata } from '@files-system/domain-module'

@Injectable()
export class S3FilesStorageAdapterImpl extends FilesStorageAdapter {
  #logger = new Logger(S3FilesStorageAdapterImpl.name)

  constructor(private readonly client: S3Client) {
    super()
  }

  override async prepareUpload(upload: Upload): Promise<string> {
    const filename = upload.bucket.path.startsWith('/')
      ? relative('/', join(upload.bucket.path, upload.filename))
      : join(upload.bucket.path, upload.filename)

    const url = await getSignedUrl(
      this.client,
      new PutObjectCommand({
        ContentType: upload.contentType,
        Bucket: upload.bucket.bucket,
        Key: filename,
      }),
      { expiresIn: 3600 }
    )

    return url
  }

  override async toFileMetadata(upload: Upload): Promise<StorageFileMetadata | undefined> {
    const filename = upload.bucket.path.startsWith('/')
      ? relative('/', join(upload.bucket.path, upload.filename))
      : join(upload.bucket.path, upload.filename)

    try {
      const response = await this.client.send(
        new HeadObjectCommand({
          Bucket: upload.bucket.bucket,
          Key: filename,
        })
      )

      const signedUrl = await getSignedUrl(
        this.client,
        new GetObjectCommand({
          Bucket: upload.bucket.bucket,
          Key: filename,
        })
      )

      return StorageFileMetadata.create(
        Object.assign(new URL(signedUrl), { search: '' }).toString(),
        response.ContentLength || upload.size,
        response.ContentType || upload.contentType
      )
    } catch (error) {
      if (error instanceof Error) {
        if ((error as any)?.$metadata?.httpStatusCode !== 404) {
          this.#logger.error(error)
        }
      }

      return undefined
    }
  }
}
