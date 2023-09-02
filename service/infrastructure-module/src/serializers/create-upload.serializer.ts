import type { Upload }          from '@files-system/domain-module'

import { CreateUploadResponse } from '@files-system/files-rpc/abstractions'

import { UploadSerializer }     from './upload.serializer.js'

export class CreateUploadSerializer extends CreateUploadResponse {
  constructor(private readonly upload: Upload) {
    super()
  }

  get result(): UploadSerializer {
    return new UploadSerializer(this.upload)
  }
}
