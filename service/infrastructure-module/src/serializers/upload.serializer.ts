import type { Upload } from '@files-system/domain-module'

import * as rpc        from '@files-system/files-system-rpc/abstractions'

export class UploadSerializer extends rpc.Upload {
  constructor(private readonly upload: Upload) {
    super()
  }

  get id(): string {
    return this.upload.id
  }

  get url(): string {
    return this.upload.url
  }
}
