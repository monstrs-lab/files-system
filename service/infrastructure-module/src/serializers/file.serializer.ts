import type { File } from '@files-system/domain-module'

import * as rpc      from '@files-system/files-system-rpc/abstractions'

export class FileSerializer extends rpc.File {
  constructor(private readonly upload: File) {
    super()
  }

  get id(): string {
    return this.upload.id
  }

  get url(): string {
    return this.upload.url
  }
}
