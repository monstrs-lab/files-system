import type { File }         from '@files-system/domain-module'

import { ListFilesResponse } from '@files-system/files-rpc/abstractions'

import { FileSerializer }    from './file.serializer.js'

export class ListFilesSerializer extends ListFilesResponse {
  constructor(private readonly query: { files: Array<File>; hasNextPage: boolean }) {
    super()
  }

  get files(): Array<FileSerializer> {
    return this.query.files.map((file) => new FileSerializer(file))
  }

  get hasNextPage(): boolean {
    return this.query.hasNextPage
  }
}
