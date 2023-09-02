import type { File } from '@files-system/domain-module'

import * as rpc      from '@files-system/files-system-rpc/abstractions'

export class FileSerializer extends rpc.File {
  constructor(private readonly file: File) {
    super()
  }

  get id(): string {
    return this.file.id
  }

  get url(): string {
    return this.file.url
  }

  get ownerId(): string {
    return this.file.ownerId
  }
}
