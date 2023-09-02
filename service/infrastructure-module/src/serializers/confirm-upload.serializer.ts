import type { File }             from '@files-system/domain-module'

import { ConfirmUploadResponse } from '@files-system/files-rpc/abstractions'

import { FileSerializer }        from './file.serializer.js'

export class ConfirmUploadSerializer extends ConfirmUploadResponse {
  constructor(private readonly file: File) {
    super()
  }

  get result(): FileSerializer {
    return new FileSerializer(this.file)
  }
}
