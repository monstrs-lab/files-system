import type { Upload }         from '@files-system/domain-module'

import { join }                from 'node:path'
import { relative }            from 'node:path'

import { Injectable }          from '@nestjs/common'
import { S3Client }            from '@monstrs/nestjs-s3-client'
import { PutObjectCommand }    from '@monstrs/nestjs-s3-client'
import { getSignedUrl }        from '@monstrs/nestjs-s3-client'

import { FilesStorageAdapter } from '@files-system/domain-module'

@Injectable()
export class S3FilesStorageAdapterImpl extends FilesStorageAdapter {
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
}
